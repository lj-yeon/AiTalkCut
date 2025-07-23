"use strict";

// 버튼, 입력창, 결과 영역 등 주요 DOM 요소를 변수에 저장합니다.
var splitBtn = document.getElementById("splitBtn");
var imageBtn = document.getElementById("imageBtn");
var scriptInput = document.getElementById("scriptInput");
var scenesContainer = document.getElementById("scenesContainer");
var imagesContainer = document.getElementById("imagesContainer"); // 씬 데이터를 저장할 변수

var scenes = []; // [1] "씬 10개로 나누기" 버튼 클릭 시 실행되는 함수

splitBtn.onclick = function _callee() {
  var script, res, data;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // 입력된 대본을 가져옵니다.
          script = scriptInput.value.trim();

          if (script) {
            _context.next = 4;
            break;
          }

          alert("대본을 입력하세요!");
          return _context.abrupt("return");

        case 4:
          // 버튼 비활성화 및 UI 초기화
          splitBtn.disabled = true;
          splitBtn.textContent = "분석 중...";
          scenesContainer.innerHTML = "";
          imagesContainer.innerHTML = "";
          imageBtn.style.display = "none";
          _context.prev = 9;
          _context.next = 12;
          return regeneratorRuntime.awrap(fetch("/api/scenes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              script: script
            })
          }));

        case 12:
          res = _context.sent;
          _context.next = 15;
          return regeneratorRuntime.awrap(res.json());

        case 15:
          data = _context.sent;

          if (!data.error) {
            _context.next = 18;
            break;
          }

          throw new Error(data.error);

        case 18:
          scenes = data.scenes; // 씬 결과를 화면에 표시

          scenesContainer.innerHTML = scenes.map(function (scene) {
            return "<div class=\"scene-block\">\n        <strong>\uC52C ".concat(scene.scene, "</strong><br/>\n        <b>\uD0A4\uC6CC\uB4DC:</b> ").concat(scene.main_keyword, "<br/>\n        <b>\uB300\uBCF8:</b> ").concat(scene.script, "\n      </div>");
          }).join(""); // 이미지 생성 버튼 표시

          imageBtn.style.display = "block";
          _context.next = 26;
          break;

        case 23:
          _context.prev = 23;
          _context.t0 = _context["catch"](9);
          alert("에러: " + _context.t0.message);

        case 26:
          // 버튼 다시 활성화
          splitBtn.disabled = false;
          splitBtn.textContent = "씬 10개로 나누기";

        case 28:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[9, 23]]);
}; // [2] "씬별 이미지 생성" 버튼 클릭 시 실행되는 함수


imageBtn.onclick = function _callee2() {
  var res, data;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (scenes.length) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return");

        case 2:
          // 버튼 비활성화 및 UI 초기화
          imageBtn.disabled = true;
          imageBtn.textContent = "이미지 생성 중...";
          imagesContainer.innerHTML = "";
          _context2.prev = 5;
          _context2.next = 8;
          return regeneratorRuntime.awrap(fetch("/api/images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              scenes: scenes
            })
          }));

        case 8:
          res = _context2.sent;
          _context2.next = 11;
          return regeneratorRuntime.awrap(res.json());

        case 11:
          data = _context2.sent;

          if (!data.error) {
            _context2.next = 14;
            break;
          }

          throw new Error(data.error);

        case 14:
          // 씬별 이미지와 정보를 화면에 표시
          imagesContainer.innerHTML = data.scenes.map(function (scene) {
            return "<div class=\"scene-block\">\n        <strong>\uC52C ".concat(scene.scene, "</strong><br/>\n        <b>\uD0A4\uC6CC\uB4DC:</b> ").concat(scene.main_keyword, "<br/>\n        <b>\uB300\uBCF8:</b> ").concat(scene.script, "<br/>\n        <img class=\"scene-image\" src=\"").concat(scene.image_url, "\" alt=\"Scene ").concat(scene.scene, " image\"/>\n      </div>");
          }).join("");
          _context2.next = 20;
          break;

        case 17:
          _context2.prev = 17;
          _context2.t0 = _context2["catch"](5);
          alert("에러: " + _context2.t0.message);

        case 20:
          // 버튼 다시 활성화
          imageBtn.disabled = false;
          imageBtn.textContent = "씬별 이미지 생성";

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[5, 17]]);
};