from typing import Tuple

class DriveModel:
    def __init__(self, capacity_gb: int, pe_cycles: int, write_amplification_base: float):
        self.capacity_gb = capacity_gb
        self.pe_cycles_limit = pe_cycles
        self.waf_base = write_amplification_base
        
        self.current_pe_cycles = 0.0
        self.health_percent = 100.0

    def apply_write(self, write_gb: float, is_random: bool) -> float:
        """
        Applies a write volume and returns the actual NAND writes considering WAF.
        """
        # Random writes drastically increase WAF for QLC, less so for TLC
        waf = self.waf_base
        if is_random:
            waf *= 2.5  # Base multiplier for random IO
            
        actual_nand_writes_gb = write_gb * waf
        
        # Calculate cycles consumed: total NAND writes / Drive Capacity
        cycles_consumed = actual_nand_writes_gb / self.capacity_gb
        self.current_pe_cycles += cycles_consumed
        
        # Update health
        self.health_percent = max(0.0, 100 - (self.current_pe_cycles / self.pe_cycles_limit) * 100)
        
        return waf

class TLC_Drive(DriveModel):
    def __init__(self, capacity_gb: int):
        super().__init__(capacity_gb=capacity_gb, pe_cycles=3000, write_amplification_base=1.1)

class QLC_Drive(DriveModel):
    def __init__(self, capacity_gb: int):
        super().__init__(capacity_gb=capacity_gb, pe_cycles=1000, write_amplification_base=1.3)
        
    def apply_write(self, write_gb: float, is_random: bool) -> float:
        # QLC is extremely sensitive to random writes
        waf = self.waf_base
        if is_random:
            waf *= 4.0  # Much higher penalty for QLC random writes
            
        actual_nand_writes_gb = write_gb * waf
        cycles_consumed = actual_nand_writes_gb / self.capacity_gb
        self.current_pe_cycles += cycles_consumed
        self.health_percent = max(0.0, 100 - (self.current_pe_cycles / self.pe_cycles_limit) * 100)
        
        return waf

class Hybrid_Drive:
    """
    Models a Device-Mapper hybrid approach (e.g. dm-cache).
    SLC acting as Cache Tier in front of a QLC backend.
    """
    def __init__(self, cache_size_gb: int, backend_capacity_gb: int):
        # SLC cache usually has 50k+ PE cycles
        self.cache = DriveModel(capacity_gb=cache_size_gb, pe_cycles=50000, write_amplification_base=1.0)
        self.backend = QLC_Drive(capacity_gb=backend_capacity_gb)
        
    def apply_write(self, write_gb: float, is_random: bool) -> Tuple[float, float]:
        """
        Returns (backend_waf, cache_hit_ratio)
        """
        # simplified hit ratio model: larger cache = better random hit ratio
        cache_ratio = self.cache.capacity_gb / self.backend.capacity_gb
        
        if is_random:
            # e.g., 2.5% cache can absorb ~80% of random writes in typical hot-spot workloads
            hit_ratio = min(0.95, cache_ratio * 40)
        else:
            hit_ratio = 0.0 # Sequential writes bypass cache or thrash it, so WAF is low anyway
            
        # Writes hitting the cache
        cache_writes = write_gb * hit_ratio
        self.cache.apply_write(cache_writes, is_random=True) # Usually treated as random to cache
        
        # Cache flushes to backend (as sequential!) + cache misses
        backend_sequential_writes = cache_writes # Eviction
        backend_miss_writes = write_gb * (1 - hit_ratio)
        
        waf1 = self.backend.apply_write(backend_sequential_writes, is_random=False)
        waf2 = self.backend.apply_write(backend_miss_writes, is_random=is_random)
        
        # Average backend WAF
        avg_backend_waf = (waf1 * backend_sequential_writes + waf2 * backend_miss_writes) / (backend_sequential_writes + backend_miss_writes + 0.0001)
        
        return avg_backend_waf, hit_ratio

    @property
    def health_percent(self) -> float:
        # System health is usually bottlenecked by backend
        return self.backend.health_percent
