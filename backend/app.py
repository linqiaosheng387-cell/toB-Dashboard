"""
Project launcher for the management backend.

Run from anywhere:
    python app.py

It starts the FastAPI application defined under ``management/`` on port 6563.
The management directory is added to sys.path so the ``app`` package resolves
there, and the working directory is switched so its ``.env`` is loaded.
"""
import os
import sys

import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MANAGEMENT_DIR = os.path.join(BASE_DIR, "management")

sys.path.insert(0, MANAGEMENT_DIR)
os.chdir(MANAGEMENT_DIR)

HOST = "127.0.0.1"
PORT = 6563

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT)
