// 버튼, 입력창, 결과 영역 등 주요 DOM 요소를 변수에 저장합니다.
const splitBtn = document.getElementById("splitBtn");
const imageBtn = document.getElementById("imageBtn");
const scriptInput = document.getElementById("scriptInput");
const scenesContainer = document.getElementById("scenesContainer");
const imagesContainer = document.getElementById("imagesContainer");

// 씬 데이터를 저장할 변수
let scenes = [];

// [1] "씬 10개로 나누기" 버튼 클릭 시 실행되는 함수
splitBtn.onclick = async () => {
  // 입력된 대본을 가져기.
  const script = scriptInput.value.trim();
  if (!script) {
    alert("대본을 입력하세요!");
    return;
  }

  // 버튼 비활성화 및 UI 초기화
  splitBtn.disabled = true;
  splitBtn.textContent = "분석 중...";
  scenesContainer.innerHTML = "";
  imagesContainer.innerHTML = "";
  imageBtn.style.display = "none";

  try {
    // 백엔드에 대본을 보내서 씬 분할 결과 받기
    const res = await fetch("/api/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    scenes = data.scenes;
    // 씬 결과를 화면에 표시
    scenesContainer.innerHTML = scenes
      .map(
        (scene) =>
          `<div class="scene-block">
        <strong>씬 ${scene.scene}</strong><br/>
        <b>키워드:</b> ${scene.main_keyword}<br/>
        <b>대본:</b> ${scene.script}
      </div>`
      )
      .join("");
    // 이미지 생성 버튼 표시
    imageBtn.style.display = "block";
  } catch (e) {
    alert("에러: " + e.message);
  }
  // 버튼 다시 활성화
  splitBtn.disabled = false;
  splitBtn.textContent = "씬 10개로 나누기";
};

// [2] "씬별 이미지 생성" 버튼 클릭 시 실행되는 함수
imageBtn.onclick = async () => {
  if (!scenes.length) return;
  // 버튼 비활성화 및 UI 초기화
  imageBtn.disabled = true;
  imageBtn.textContent = "이미지 생성 중...";
  imagesContainer.innerHTML = "";

  try {
    // 백엔드에 씬 배열을 보내서 이미지 URL을 받기
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    // 씬별 이미지와 정보를 화면에 표시
    imagesContainer.innerHTML = data.scenes
      .map(
        (scene) =>
          `<div class="scene-block">
        <strong>씬 ${scene.scene}</strong><br/>
        <b>키워드:</b> ${scene.main_keyword}<br/>
        <b>대본:</b> ${scene.script}<br/>
        <img class="scene-image" src="${scene.image_url}" alt="Scene ${scene.scene} image"/>
      </div>`
      )
      .join("");
  } catch (e) {
    alert("에러: " + e.message);
  }
  // 버튼 다시 활성화
  imageBtn.disabled = false;
  imageBtn.textContent = "씬별 이미지 생성";
};
