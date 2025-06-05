// ✅ "자치법규명", "자치법규상세링크" 등 새 구조 반영한 전체 코드

let dataLoaded = false;
let cachedData = [];
let filterData = [];

function filterByKeyword(keyword) {
  if (!keyword) {
    filterData = [...cachedData]; // 전체 복사
  } else {
    const lowerKeyword = keyword.toLowerCase();
    filterData = cachedData.filter(
      (law) =>
        (law["자치법규명"] &&
          law["자치법규명"].toLowerCase().includes(lowerKeyword)) ||
        (law["지자체기관명"] &&
          law["지자체기관명"].toLowerCase().includes(lowerKeyword)) ||
        (law["자치법규분야명"] &&
          law["자치법규분야명"].toLowerCase().includes(lowerKeyword))
    );
  }

  console.log("🔍 필터 결과 수:", filterData.length);
  renderLaws(filterData);
}

function renderLaws(data) {
  const container = document.getElementById("laws-container");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  data.forEach((law) => {
    const card = document.createElement("div");
    card.className = "law-card";

    card.innerHTML = `
      <div class="law-title">${law["자치법규명"]}</div>
      ${Object.entries(law)
        .filter(([key]) => key !== "자치법규명")
        .map(([key, value]) => {
          if (key === "자치법규상세링크" && value) {
            return `
              <div class="law-section">
                <span class="law-label">${key}:</span>
                <span class="law-value">
                  <button class="detail-btn" data-link="${value}">상세 보기</button>
                </span>
              </div>
            `;
          } else {
            return `
              <div class="law-section">
                <span class="law-label">${key}:</span>
                <span class="law-value">${value || "없음"}</span>
              </div>
            `;
          }
        })
        .join("")}
    `;

    container.appendChild(card);
  });

  attachDetailEventListeners();
}

async function fetchAllData() {
  const totalPages = 200;
  document.getElementById("Info").innerText = "🔴 데이터 불러오는 중입니다...";

  for (let page = 1; page <= totalPages; page++) {
    const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=kom6381&target=ordin&type=JSON&page=${page}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const pageData = json?.OrdinSearch?.law;

      if (Array.isArray(pageData)) {
        cachedData = cachedData.concat(pageData);
        console.log(`${page} 페이지 로드 완료, 항목 수: ${pageData.length}`);
      } else {
        console.warn(`${page} 페이지: 데이터 없음 또는 형식 오류`, json);
      }
    } catch (err) {
      console.error(`${page} 페이지 로드 실패`, err);
    }
  }

  dataLoaded = true;
  document.getElementById("Info").innerText = "🟢 데이터 다 불러옴!";
  renderLaws(cachedData);
}

function attachDetailEventListeners() {
  document.querySelectorAll(".detail-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const link = btn.dataset.link;
      const jsonLink = `https://www.law.go.kr${link.replace(
        "&type=HTML",
        "&type=JSON"
      )}`;

      try {
        const res = await fetch(jsonLink);
        const data = await res.json();
        console.log(data);
        renderDetailData(data);
      } catch (err) {
        alert("상세 정보를 불러오는 데 실패했습니다.");
        console.error("상세 정보 에러:", err);
      }
    });
  });
}

function renderDetailData(json) {
  const container = document.getElementById("laws-container");
  container.innerHTML = "<h2>📘 상세 법령 정보</h2>";

  const lawService = json?.LawService;
  if (!lawService) {
    container.innerHTML += "<p>데이터 형식이 올바르지 않습니다.</p>";
    return;
  }

  // 1. 기본 정보 출력
  const basicInfo = lawService["자치법규기본정보"];
  if (basicInfo) {
    container.innerHTML += `<h3>🧾 자치법규 기본 정보</h3>`;
    Object.entries(basicInfo).forEach(([key, value]) => {
      container.innerHTML += `
        <div class="law-section">
          <span class="law-label">${key}:</span>
          <span class="law-value">${value || "없음"}</span>
        </div>
      `;
    });
  }

  // 2. 객체 또는 배열을 사람이 읽을 수 있도록 출력
  const complexSections = ["부칙", "조문", "별표"];
  complexSections.forEach((section) => {
    const value = lawService[section];
    if (value && typeof value === "object") {
      container.innerHTML += `<h3>📄 ${section}</h3><pre class="law-value">${JSON.stringify(
        value,
        null,
        2
      )}</pre>`;
    } else if (value) {
      container.innerHTML += `<h3>📄 ${section}</h3><div class="law-section"><span class="law-value">${value}</span></div>`;
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  fetchAllData();

  document
    .getElementById("search-input")
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        document.getElementById("search-btn").click();
      }
    });

  document.getElementById("search-btn").addEventListener("click", () => {
    if (!dataLoaded) {
      alert("아직 데이터가 로딩 중입니다. 잠시만 기다려주세요.");
      return;
    }
    const keyword = document.getElementById("search-input").value.trim();
    filterByKeyword(keyword);
  });
});
