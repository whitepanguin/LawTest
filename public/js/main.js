let dataLoaded = false;
let cachedData = [];
let filterData = [];

function filterByKeyword(keyword) {
  if (!keyword) {
    filterData = [...cachedData]; // 빈 키워드면 전체 복사
  } else {
    const lowerKeyword = keyword.toLowerCase();
    filterData = cachedData.filter((law) => {
      // 여기서는 법령명한글, 법령구분명, 소관부처명 등 여러 필드 검색 가능
      return (
        (law["법령명한글"] &&
          law["법령명한글"].toLowerCase().includes(lowerKeyword)) ||
        (law["법령구분명"] &&
          law["법령구분명"].toLowerCase().includes(lowerKeyword)) ||
        (law["소관부처명"] &&
          law["소관부처명"].toLowerCase().includes(lowerKeyword))
      );
    });
  }
  renderLaws(filterData);
}

function renderLaws(data) {
  const container = document.getElementById("laws-container");
  container.innerHTML = ""; // 초기화

  if (data.length === 0) {
    container.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  data.forEach((law) => {
    const card = document.createElement("div");
    card.className = "law-card";

    card.innerHTML = `
      <div class="law-title">${law["법령명한글"]}</div>
      ${Object.entries(law)
        .filter(([key]) => key !== "법령명한글")
        .map(([key, value]) => {
          if (key === "법령상세링크" && value) {
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
  const totalPages = 275;
  document.getElementById("Info").innerText = "🔴 데이터 불러오는 중입니다...";

  for (let page = 1; page <= totalPages; page++) {
    const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=kom6381&target=law&type=JSON&page=${page}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const pageData = json?.LawSearch?.law;

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

function loadData() {
  const container = document.getElementById("data");
  container.innerHTML = ""; // 초기화

  cachedData.forEach((law) => {
    const card = document.createElement("div");
    card.className = "law-card";

    card.innerHTML = `
  <div class="law-title">${law["법령명한글"]}</div>
  ${Object.entries(law)
    .filter(([key]) => key !== "법령명한글") // 제목은 별도 출력했으니 제외
    .map(([key, value]) => {
      // 링크일 경우 a 태그로 감싸기
      if (key === "법령상세링크" && value) {
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
        renderDetailData(data); // 상세 정보 뿌리기
      } catch (err) {
        alert("상세 정보를 불러오는 데 실패했습니다.");
        console.error("상세 정보 에러:", err);
      }
    });
  });
}
function renderDetailData(json) {
  const container = document.getElementById("laws-container");
  container.innerHTML = `
    <button id="back-btn">🔙 돌아가기</button>
    <h2>📘 상세 법령 정보</h2>
    <div id="section-buttons" style="margin-bottom: 20px;"></div>
    <div id="detail-sections"></div>
  `;

  const sectionButtons = document.getElementById("section-buttons");
  const detailContainer = document.getElementById("detail-sections");

  const law = json?.법령;
  if (!law) {
    detailContainer.innerHTML = "<p>데이터 형식이 올바르지 않습니다.</p>";
    return;
  }

  // ✅ 표시할 항목들 순서 정의
  const sectionOrder = [
    "개정문",
    "법령키",
    "별표",
    "기본정보",
    "부칙",
    "조문",
    "제개정이유",
  ];

  // ✅ 각 항목 존재 여부 확인 후 버튼 생성
  sectionOrder.forEach((sectionName) => {
    const keyExists = Object.keys(law).some((k) => k.includes(sectionName));
    if (keyExists) {
      const button = document.createElement("button");
      button.innerText = `📎 ${sectionName}`;
      button.addEventListener("click", () => {
        const target = document.getElementById(`section-${sectionName}`);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
      sectionButtons.appendChild(button);
    }
  });

  // ✅ 렌더링 함수 정의
  function renderValue(value) {
    if (typeof value === "string") {
      if (value.includes("/LSW/")) {
        return `<a href="https://www.law.go.kr${value}" target="_blank" rel="noopener">🔗 링크</a>`;
      }
      return value;
    } else if (Array.isArray(value)) {
      return value
        .map((item) => `<div class="nested-item">${renderValue(item)}</div>`)
        .join("");
    } else if (typeof value === "object" && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => {
          const isLink =
            k.includes("링크") || k.includes("파일") || k.includes("다운로드");
          if (isLink && typeof v === "string" && v.includes("/LSW/")) {
            return `
              <div class="law-section">
                <span class="law-label">${k}:</span>
                <span class="law-value">
                  <a href="https://www.law.go.kr${v}" target="_blank" rel="noopener">📎 링크 바로가기</a>
                </span>
              </div>
            `;
          } else {
            return `
              <div class="law-section">
                <span class="law-label">${k}:</span>
                <span class="law-value">${renderValue(v)}</span>
              </div>
            `;
          }
        })
        .join("");
    } else {
      return value;
    }
  }

  // ✅ 실제 내용 렌더링
  for (const [key, value] of Object.entries(law)) {
    // 어떤 섹션에 해당하는지 판단
    let sectionId = "";
    for (const section of sectionOrder) {
      if (key.includes(section)) {
        sectionId = `section-${section}`;
        break;
      }
    }

    detailContainer.innerHTML += `
      <div class="law-section" ${sectionId ? `id="${sectionId}"` : ""}>
        <span class="law-label">${key}:</span>
        <span class="law-value">${renderValue(value)}</span>
      </div>
    `;
  }

  // ✅ 돌아가기 버튼 이벤트
  document.getElementById("back-btn").addEventListener("click", () => {
    renderLaws(filterData.length > 0 ? filterData : cachedData);
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
  document
    .getElementById("search-input")
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        document.getElementById("search-btn").click();
      }
    });
});
