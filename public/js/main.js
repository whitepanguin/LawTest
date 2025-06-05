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
  container.innerHTML = "<h2>📘 상세 법령 정보</h2>";

  const law = json?.법령;

  if (!law) {
    container.innerHTML += "<p>데이터 형식이 올바르지 않습니다.</p>";
    return;
  }

  // 전체 항목을 순회하면서 각 키와 값을 표시
  Object.entries(law).forEach(([key, value]) => {
    // 객체나 배열인 경우는 JSON 문자열로 출력
    const formattedValue =
      typeof value === "object"
        ? `<pre>${JSON.stringify(value, null, 2)}</pre>`
        : value;

    container.innerHTML += `
      <div class="law-section">
        <span class="law-label">${key}:</span>
        <span class="law-value">${formattedValue}</span>
      </div>
    `;
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
