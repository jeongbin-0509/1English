from flask import Flask, render_template, request, redirect, url_for, make_response, flash
from supabase import create_client
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pathlib import Path
import os

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-this")

limiter = Limiter(get_remote_address, app=app, default_limits=["200/hour"], storage_uri="memory://")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/")
def home():
    return redirect(url_for("login"))

# 로그인파트
@app.route("/login", methods=["GET","POST"])
@limiter.limit("10/minute")
def login():
    if request.method == "POST":
        email = request.form.get("username")
        password = request.form.get("password")

        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        user = res.user
        session = res.session

        if user and session:
            resp = make_response(redirect(url_for("dashboard")))
            resp.set_cookie("access_token", session.access_token, httponly=True, secure=False, samesite="Lax")
            resp.set_cookie("refresh_token", session.refresh_token, httponly=True, secure=False, samesite="Lax")
            return resp
        return "로그인 실패", 401

    return render_template("login.html")

# 회원가입파트
@app.route("/signup", methods=["GET","POST"])
@limiter.limit("5/minute")
def signup():
    if request.method == "POST":
        email = request.form.get("username")
        password = request.form.get("password")

        res = supabase.auth.sign_up({"email": email, "password": password})
        user = res.user

        if user:
            flash("회원가입 성공! 이메일 인증을 확인하세요.")
            return redirect(url_for("login"))
        else:
            return "회원가입 실패", 400

    return render_template("signup.html")

@app.route("/dashboard")
def dashboard():
    token = request.cookies.get("access_token")
    if not token:
        return redirect(url_for("login"))
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        return redirect(url_for("login"))
    return f"환영합니다, {user.email}!"

@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    return resp

@app.route("/signup")
def signup_page():
    return render_template("signup.html")

@app.route("/about")
def about_page():
    return render_template("login.html")


if __name__ == "__main__":
    app.run(debug=True)

