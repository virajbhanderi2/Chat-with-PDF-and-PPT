"""
RAG (Retrieval-Augmented Generation) Pipeline Implementation
"""

from typing import List

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document

from config import Config

def format_docs(docs: List[Document]) -> str:
    """Format retrieved document chunks for LLM prompt."""
    return "\n\n".join(doc.page_content for doc in docs)

def load_rag_chain(chunks: List[str]):
    """Initialize and return a simplified RAG chain."""
    try:
        # 1. Initialize embedding model
        embedding_model = HuggingFaceEmbeddings(
            model_name=Config.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # 2. Create vector database and retriever
        vector_db = FAISS.from_texts(texts=chunks, embedding=embedding_model)
        retriever = vector_db.as_retriever(search_kwargs={"k": Config.RETRIEVAL_K})
        
        # 3. Define prompt template
        prompt_template = """
You are a professional PDF document assistant. Answer questions strictly based 
on the context provided below.

Rules:
1. Only answer using information from the Context.
2. If the answer is not in the Context, explicitly state: "I cannot find this information in the uploaded PDF document."
3. Be concise but comprehensive.

Context: {context}

Question: {question}

Answer:
"""
        prompt = ChatPromptTemplate.from_template(prompt_template)
        
        # 4. Initialize LLM
        llm = OllamaLLM(
            model=Config.OLLAMA_MODEL,
            base_url=Config.OLLAMA_BASE_URL,
            temperature=Config.LLM_TEMPERATURE,
            num_predict=Config.LLM_MAX_TOKENS
        )
        
        # 5. Create and return the RAG chain
        rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
        )
        
        return rag_chain
        
    except Exception as e:
        raise Exception(f"Failed to initialize RAG pipeline: {str(e)}")
