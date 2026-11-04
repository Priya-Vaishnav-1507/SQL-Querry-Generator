
import os
from pathlib import Path
import streamlit as st
from groq import Groq
from dotenv import load_dotenv

# Load the key from this project's .env, regardless of the folder Streamlit
# was launched from.
ENV_FILE = Path(__file__).resolve().with_name(".env")
load_dotenv(dotenv_path=ENV_FILE, override=True)

# Page settings
st.set_page_config(
    page_title="AI SQL Query Generator",
    page_icon="Q",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

    :root {
        --ink: #f4f4f5;
        --muted: #a1a1aa;
        --line: #303038;
        --green: #75c995;
        --green-dark: #55ad78;
        --paper: #09090b;
        --surface: #151518;
    }

    .stApp {
        background: var(--paper);
        color: var(--ink);
        font-family: 'DM Sans', sans-serif;
    }
    [data-testid="stAppViewContainer"] { background: var(--paper); }
    [data-testid="stHeader"], [data-testid="stToolbar"], [data-testid="stDecoration"] {
        display: none !important;
    }
    .block-container {
        max-width: 1160px;
        padding: 2rem 2rem 3rem;
    }
    .workspace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 1.2rem;
        border-bottom: 1px solid var(--line);
        margin-bottom: 1.5rem;
    }
    .brand-lockup { display: flex; align-items: center; gap: .7rem; }
    .brand-mark {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--green);
        color: white;
        font: 800 17px 'Manrope', sans-serif;
    }
    .brand-name { font: 800 16px 'Manrope', sans-serif; letter-spacing: 0; }
    .workspace-status {
        display: inline-flex;
        align-items: center;
        gap: .5rem;
        padding: .45rem .7rem;
        border: 1px solid var(--line);
        border-radius: 5px;
        background: #151518;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .04em;
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #67a978; }
    .hero {
        margin: 0 0 1.2rem;
        padding: .5rem 0 1.2rem;
        color: var(--ink);
        text-align: center;
    }
    .eyebrow {
        color: var(--green);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .12em;
        text-transform: uppercase;
    }
    .hero h1 {
        margin: .25rem 0 .35rem;
        color: var(--ink);
        font: 700 30px/1.2 'Manrope', sans-serif;
        letter-spacing: 0;
    }
    .hero p { margin: 0; color: var(--muted); font-size: 14px; }
    [data-testid="stVerticalBlockBorderWrapper"] > div {
        border: 1px solid var(--line) !important;
        border-radius: 6px !important;
        background: var(--surface);
    }
    .panel-heading { margin: 0 0 .15rem; }
    .panel-step {
        color: var(--green);
        font: 500 11px 'DM Mono', monospace;
        letter-spacing: .04em;
    }
    .panel-heading h2 {
        margin: .35rem 0 .25rem;
        color: var(--ink);
        font: 700 19px 'Manrope', sans-serif;
        letter-spacing: 0;
    }
    .panel-heading p { margin: 0 0 1rem; color: var(--muted); font-size: 13px; }
    [data-testid="stWidgetLabel"] p {
        color: #d4d4d8;
        font-size: 12px;
        font-weight: 600;
    }
    [data-testid="stTextArea"] textarea,
    [data-testid="stSelectbox"] [role="combobox"] {
        border-color: var(--line);
        border-radius: 5px;
        background: #0e0e11;
        color: var(--ink);
        font-family: 'DM Sans', sans-serif;
    }
    [data-testid="stTextArea"] textarea::placeholder { color: #71717a; }
    [data-testid="stSelectbox"] [role="combobox"] { color: var(--ink); }
    [data-testid="stSelectbox"] [data-baseweb="select"] > div { background: #0e0e11; }
    [data-testid="stTextArea"] textarea:focus,
    [data-testid="stSelectbox"] [role="combobox"]:focus {
        border-color: var(--green) !important;
        box-shadow: 0 0 0 1px var(--green) !important;
    }
    [data-testid="stTextArea"] textarea { font-size: 13px; line-height: 1.55; }
    [data-testid="stSelectbox"] [role="combobox"] { min-height: 42px; }
    [data-testid="stButton"] button[kind="primary"] {
        min-height: 43px;
        border: 1px solid var(--green);
        border-radius: 5px;
        background: var(--green);
        color: #fff;
        font-weight: 700;
        transition: background .15s ease, border-color .15s ease;
    }
    [data-testid="stButton"] button[kind="primary"]:hover {
        border-color: var(--green-dark);
        background: var(--green-dark);
    }
    [data-testid="stButton"] button[kind="secondary"] {
        min-height: 34px;
        border: 1px solid var(--line);
        border-radius: 5px;
        background: #202024;
        color: #c4c4cb;
        font-size: 11px;
        font-weight: 600;
    }
    [data-testid="stButton"] button[kind="secondary"]:hover {
        border-color: #4a4a52;
        background: #29292f;
        color: var(--green-dark);
    }
    [data-testid="stAlert"] { border-radius: 6px; }
    [data-testid="stCode"] {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #0e0e11;
    }
    .result-heading {
        margin: 1.8rem 0 .7rem;
        color: var(--ink);
        font: 700 17px 'Manrope', sans-serif;
    }
    .safety-note { color: var(--muted); font-size: 12px; }
    [data-testid="stMarkdownContainer"], [data-testid="stCaptionContainer"] { color: var(--muted); }
    [data-testid="stAlert"] { background: #211b12; color: #f4d28a; }
    [data-baseweb="popover"] [role="listbox"] { background: #1b1b20; }
    [data-baseweb="popover"] [role="option"] { color: #f4f4f5; }
    [data-baseweb="popover"] [role="option"]:hover { background: #303038; }
    .page-foot {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--line);
        color: #71717a;
        font-size: 11px;
    }
    @media (max-width: 700px) {
        .block-container { padding: 1.2rem 1rem 2rem; }
        .workspace-head { margin-bottom: 1.3rem; padding-bottom: 1rem; }
        .hero h1 { font-size: 27px; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Create AI client
api_key = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")

status_label = "API KEY SET" if api_key else "API KEY NEEDED"
st.markdown(
        f"""
        <div class="workspace-head">
            <div class="brand-lockup"><span class="brand-mark">Q.</span><span class="brand-name">querycraft</span></div>
            <span class="workspace-status"><span class="status-dot"></span>{status_label}</span>
        </div>
        <section class="hero">
            <div class="eyebrow">AI SQL WORKSPACE</div>
            <h1>SQL Query Generator</h1>
            <p>Describe your schema, ask for what you need, and review the query before you use it.</p>
        </section>
        """,
        unsafe_allow_html=True,
)

default_schema = """Table: students
Columns:
- id (INTEGER)
- name (TEXT)
- age (INTEGER)
- marks (INTEGER)
- department (TEXT)"""

schema_column, request_column = st.columns([1.05, 0.95], gap="large")

with schema_column:
    with st.container(border=True):
        st.markdown(
            '<div class="panel-heading"><div class="panel-step">01 / DATABASE</div>'
            '<h2>Describe your schema</h2><p>List the tables and columns available to the model.</p></div>',
            unsafe_allow_html=True,
        )
        schema = st.text_area(
            "Tables and columns",
            value=default_schema,
            height=205,
            help="Include table names and column names with their data types.",
        )

with request_column:
    with st.container(border=True):
        st.markdown(
            '<div class="panel-heading"><div class="panel-step">02 / REQUEST</div>'
            '<h2>What do you need?</h2><p>Ask in plain English. The model will use your schema.</p></div>',
            unsafe_allow_html=True,
        )
        question = st.text_area(
            "Your question",
            placeholder="Show students who scored more than 80 marks",
            height=125,
            key="question",
        )
        dialect = st.selectbox(
            "SQL dialect",
            ["SQLite", "MySQL", "PostgreSQL"],
        )
        generate_clicked = st.button("Generate SQL", type="primary", use_container_width=True)
        st.markdown(
            '<div class="safety-note">Read-only query generation · Always review before execution</div>',
            unsafe_allow_html=True,
        )

if generate_clicked:
    if not api_key:
        st.error(
            "API key not found. Add GROQ_API_KEY=your_groq_api_key to the "
            "project's .env file, then restart the app."
        )
    elif not question.strip():
        st.warning("Please enter a question first.")
    elif not schema.strip():
        st.warning("Please provide your database schema.")
    else:
        try:
            client = Groq(api_key=api_key)

            with st.spinner("Checking available models and generating SQL..."):
                available_model_ids = {
                    model.id for model in client.models.list().data
                }
                model_priority = [
                    "openai/gpt-oss-20b",
                    "openai/gpt-oss-120b",
                    "qwen/qwen3.8-27b",
                ]
                available_models = [
                    model_id for model_id in model_priority
                    if model_id in available_model_ids
                ]
                if not available_models:
                    raise RuntimeError(
                        "No supported text-generation models are available for this API key."
                    )

                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert SQL assistant. "
                            "Generate a SQL query from the user's question. "
                            "Use only the provided tables and columns. "
                            "Return the SQL query first, inside a SQL code block. "
                            "Then briefly explain the query. "
                            "Never generate INSERT, UPDATE, DELETE, DROP, "
                            "ALTER, or other data-modifying statements. "
                            "Only generate read-only SELECT queries. "
                            "If the question cannot be answered using the "
                            "schema, explain why instead of inventing columns."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"SQL dialect: {dialect}\n"
                            f"Database schema:\n{schema}\n\n"
                            f"Question: {question}"
                        )
                    }
                ]
                response = None
                last_model_error = None
                for model_id in available_models:
                    try:
                        response = client.chat.completions.create(
                            model=model_id,
                            messages=messages,
                            temperature=0.1,
                        )
                        break
                    except Exception as model_error:
                        last_model_error = model_error

                if response is None:
                    raise RuntimeError(
                        "All available Groq models failed to generate a response."
                    ) from last_model_error

            answer = response.choices[0].message.content

            st.markdown('<div class="result-heading">03 / Generated SQL</div>', unsafe_allow_html=True)
            with st.container(border=True):
                st.markdown(answer)
                st.caption("Review the generated SQL before running it on a real database.")

        except Exception as e:
            error_text = str(e)
            if "401" in error_text or "authentication" in error_text.lower() or "invalid api key" in error_text.lower():
                st.error(
                    "Groq rejected the API key. Check that it is current, has "
                    "no extra spaces, and is saved as GROQ_API_KEY in .env. "
                    "Restart the app after changing it."
                )
            elif "429" in error_text or "rate_limit" in error_text.lower():
                st.error("Groq is rate-limiting requests right now. Wait a moment and try again.")
            elif "model" in error_text.lower() or "404" in error_text:
                st.error("No available Groq model could complete this request. Please try again shortly.")
            else:
                st.error("SQL generation failed. Check your internet connection and Groq API access, then try again.")

st.markdown(
    '<div class="page-foot">QUERYCRAFT · Built with Python, Streamlit, and Generative AI</div>',
    unsafe_allow_html=True,
)
