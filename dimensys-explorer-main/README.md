# DimenSys AI

Multi-Dimensional AI Reasoning Platform

## Overview

DimenSys AI is an advanced multi-dimensional analysis system that processes text through multiple AI dimensions including sentiment, intent, risk, and semantic analysis.

## Features

- **Multi-Dimensional Analysis**: Sentiment, Intent, Risk, and Semantic analysis
- **Real-time Processing**: Live pipeline visualization
- **Model Switching**: Support for multiple NVIDIA AI models
- **Export Capabilities**: JSON and text export options
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI Models**: NVIDIA NIM API integration
- **Deployment**: Vercel (frontend), Railway/Render (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- NVIDIA API Key

### Installation

1. Clone the repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `pip install -r backend/requirements.txt`
4. Set up environment variables
5. Run frontend: `npm run dev`
6. Run backend: `python -m uvicorn backend.main:app --reload`

## Configuration

Set the following environment variables:

- `NVIDIA_API_KEY`: Your NVIDIA API key
- `NIM_CHAT_MODEL`: Default AI model (e.g., "meta/llama-3.1-8b-instruct")
- `VITE_API_URL`: Backend API URL

## Usage

1. Enter text for analysis
2. Select dimensions to analyze
3. Choose AI model
4. View real-time processing
5. Export results

## License

MIT License
