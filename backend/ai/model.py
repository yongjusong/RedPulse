# model.py / Facade Routing Module
# As per RedPulse Patent Architecture (Asymmetric Compute separation),
# this file now acts purely as a routing facade.
# Physical simulation generation and lightweight inference are strictly segregated.

from .live_inference import (
    load_lstm_model,
    predict_rul_with_lstm,
    predict_rul_telemetry,
    predict_rul_ensemble,
    SSDLifeLSTM
)

# For any offline data generation tasks, refer to:
# from .synthetic_generator import run_offline_batch_synthesis
