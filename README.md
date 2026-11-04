# SQL Query Generator

Turn plain-English questions into SQL with a Streamlit app powered by Groq. The project also includes a standalone browser-based query-builder demo that works with sample data.

## Features

- Generate SQL from a natural-language question and a user-provided database schema.
- Choose SQLite, MySQL, or PostgreSQL as the SQL dialect.
- Ask the AI to use only the supplied tables and columns and return read-only queries.
- Try the separate visual query builder with sample tables, filters, sorting, row limits, and result previews.
- Keep the Groq API key in a local environment file instead of source code.

## Requirements

- Python 3.10 or later
- A Groq API key for AI query generation

## Setup on Windows

1. Open PowerShell in the project folder.
2. Create and activate a virtual environment:

   ```powershell
   py -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:

   ```powershell
   python -m pip install -r requirements.txt
   ```

4. Create `.env` from the example and add your Groq API key:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `GROQ_API_KEY` in `.env` to your own key. Do not commit or share this file.

5. Start the Streamlit app:

   ```powershell
   streamlit run app.py
   ```

   Alternatively, run `Run Project.bat` from File Explorer after the virtual environment and dependencies are set up.

## Visual Query Builder Demo

Open `index.html` in a browser to try the standalone visual builder. It uses bundled sample data; it does not connect to a real database or use the Groq API.

## Project Files

- `app.py` - Streamlit AI SQL generator.
- `requirements.txt` - Python dependencies.
- `Run Project.bat` - Windows launcher for the Streamlit app.
- `index.html`, `app.js`, `styles.css` - Standalone visual query-builder demo.
- `.env.example` - Environment-variable template; put the real API key in the ignored `.env` file.

## Security Note

Review every generated query before using it. The application asks the model for read-only SQL, but that instruction is not a substitute for validating a query before running it against a database.