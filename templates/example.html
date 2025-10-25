<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>영어 수행 연습 - 예문</title>

    <!-- 경로/엔드포인트 이름은 네 앱에 맞게 사용 -->
    <link rel="icon" href="{{ url_for('static', filename='images/favicon.png') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/example.css') }}">
  </head>
  <body>
    <!-- 햄버거 버튼 -->
    <button class="hamburger" id="sidebarToggle" aria-expanded="false" onclick="openSidebar()">
      <span></span><span></span><span></span>
    </button>

    <!-- 사이드바 -->
    <div class="sidebar" id="sidebar">
      <button class="close-btn" onclick="closeSidebar()"></button>
      <h2>단<span class="accent">어</span>장 by <span class="accent">;</span></h2>
      <hr class="divider" />
      <div class="menu-stack">
        <form action="{{ url_for('main_page') }}" method="get">
          <button class="menu-btn" type="submit">DAY 재선택</button>
        </form>
        <form action="{{ url_for('odap') }}">
          <button class="menu-btn" type="submit">오답복습</button>
        </form>
        <form action="{{ url_for('words') }}">
          <button class="menu-btn" type="submit">단어장 바로가기</button>
        </form>
        <form action="{{ url_for('logout') }}">
          <button class="menu-btn" type="submit">로그아웃</button>
        </form>
      </div>
    </div>
    <div id="sidebarOverlay" class="overlay"></div>

    <main class="wrap">
      <section class="card" id="card">
        <!-- 우상단 즐겨찾기 -->
        <button class="corner-star" id="favBtn" title="즐겨찾기 토글">★</button>

        <div class="head">
          <span class="chip" id="counter">1 out of 1</span>
        </div>

        <div class="content">
          <p class="en" id="en">Loading…</p>
          <p class="ko" id="ko" aria-live="polite"></p>

          <!-- 오답 피드백 박스 (오답 때만 표시) -->
          <div id="feedback" class="feedback" hidden>
            <div class="fb-row">
              <span class="fb-label">내 답</span>
              <span class="fb-value" id="myAnswer">-</span>
            </div>
            <div class="fb-row">
              <span class="fb-label">정답</span>
              <span class="fb-value correct" id="rightAnswer">-</span>
            </div>
          </div>
        </div>

        <!-- 기본 액션 (문제 진행 중) -->
        <div class="actions" id="actions">
          <button class="btn" id="submitBtn">확인</button>
        </div>

        <!-- ✅ 최종 화면 전용 패널 (처음엔 숨김) -->
        <section id="finalPanel" class="final-panel" hidden>
          <div class="final-actions">
            <button class="btn" id="btnShowWrong">틀린 단어 보기</button>
            <button class="btn btn-outline" id="btnBackToDay">DAY 재선택으로 돌아가기</button>
          </div>

          <section id="wrongSection" class="wrong-section" hidden>
            <h3 class="wrong-title">틀린 단어</h3>
            <div id="wrongList"></div>
          </section>
        </section>

      </section>

      <div class="result" aria-hidden="true">
        <div class="bar" id="progressBar"></div>
      </div>
      <div class="legend">
        <span class="good" id="goodCnt">0 정답</span>
        <span class="bad" id="badCnt">0 오답</span>
      </div>
    </main>

    <script>
      /* 네 앱 라우트명에 맞추기 — 홈이 main_page면 이렇게 둬 */
      window.WORDS_URL = "{{ url_for('static', filename='data/words.json') }}";
      window.INDEX_URL = "{{ url_for('main_page') }}";
    </script>
    <script src="{{ url_for('static', filename='javascript/index.js') }}"></script>
    <script src="{{ url_for('static', filename='javascript/example.js') }}"></script>
  </body>
</html>
