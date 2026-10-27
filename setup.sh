#!/usr/bin/env bash
set -e

echo "=== GNN Molecular Prediction Setup ==="
echo "Target OS: Ubuntu Linux (CPU-only configuration)"

# Determine Python command
PYTHON_BIN="python3"
if ! command -v $PYTHON_BIN &> /dev/null; then
    echo "Error: Python 3 not found."
    exit 1
fi

VENV_DIR=".venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment in $VENV_DIR..."
    if ! $PYTHON_BIN -m venv "$VENV_DIR" 2>/dev/null; then
        echo "python3 -m venv failed, attempting virtualenv fallback..."
        if ! command -v virtualenv &> /dev/null; then
            pip3 install --user virtualenv
        fi
        ~/.local/bin/virtualenv "$VENV_DIR"
    fi
else
    echo "Virtual environment $VENV_DIR already exists."
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing CPU-only PyTorch and project dependencies..."
pip install -r requirements.txt

# Create project skeleton directories
mkdir -p configs data src/models app results/checkpoints results/plots tests

echo "Verifying environment installation..."
python -c "
import torch
import torch_geometric
import rdkit
from rdkit import Chem
import sklearn

torch.set_num_threads(4)
print('✓ PyTorch Version:', torch.__version__, '(CPU-only, CUDA available:', torch.cuda.is_available(), ')')
print('✓ PyTorch Geometric Version:', torch_geometric.__version__)
print('✓ RDKit Version:', rdkit.__version__)
print('✓ Scikit-learn Version:', sklearn.__version__)
print('✓ CPU Thread limit set to:', torch.get_num_threads())
"

echo "=== Setup completed successfully! ==="
