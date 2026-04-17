import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import os

class SSDLifeLSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=64, num_layers=2):
        super(SSDLifeLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, 1) # Output: Predicted years

    def forward(self, x):
        # x shape: (Batch, Seq, Features)
        out, _ = self.lstm(x)
        # We only care about the last hidden state of the sequence
        last_hidden = out[:, -1, :] 
        return self.fc(last_hidden)

def train_model(epochs=50, batch_size=32):
    if not os.path.exists("ai/data/lstm_dataset.pt"):
        print("Error: Dataset not found. Run gen_timeseries_data.py first.")
        return

    data = torch.load("ai/data/lstm_dataset.pt")
    X, y = data["X"], data["y"]
    
    # Simple split
    split = int(0.8 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    
    dataset = TensorDataset(X_train, y_train)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    model = SSDLifeLSTM()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("--- Starting LSTM Training ---")
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        for bx, by in loader:
            optimizer.zero_grad()
            pred = model(bx)
            loss = criterion(pred, by)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        if (epoch + 1) % 10 == 0:
            model.eval()
            with torch.no_grad():
                val_pred = model(X_val)
                val_loss = criterion(val_pred, y_val)
                print(f"Epoch {epoch+1}/{epochs} | Train Loss: {epoch_loss/len(loader):.4f} | Val Loss: {val_loss.item():.4f}")

    os.makedirs("ai/models", exist_ok=True)
    torch.save(model.state_dict(), "ai/models/ssd_lstm_v1.pth")
    print("Training Complete. Model saved to ai/models/ssd_lstm_v1.pth")

if __name__ == "__main__":
    train_model()
