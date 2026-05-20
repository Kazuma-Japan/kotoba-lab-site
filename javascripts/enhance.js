(function () {
  // MkDocs Material uses instant navigation; re-run on every page load
  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(run);
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  }

  function run() {
    const article = document.querySelector(".md-content article, .md-content");
    if (!article) return;
    enhanceDialogue(article);
    enhanceSprint(article);
    enhanceKeyPhrases(article);
    enhanceScenarioIntro(article);
    enhanceGrammarPoint(article);
    enhanceAITemplate(article);
    addRomaji(article);
  }

  // ---------- Dialogue ----------
  function enhanceDialogue(article) {
    const h3s = article.querySelectorAll("h3");
    h3s.forEach((h3) => {
      const txt = h3.textContent || "";
      if (!/モデル会話|最終.*シナリオ/.test(txt)) return;
      if (h3.dataset.dialogueDone === "1") return;
      h3.dataset.dialogueDone = "1";
      processDialogueAfter(h3);
    });
  }

  function processDialogueAfter(h3) {
    let node = h3.nextElementSibling;
    const speakers = new Map();
    let nextIdx = 1;
    while (node && !/^H[1-3]$/.test(node.tagName)) {
      const next = node.nextElementSibling;
      if (node.tagName === "P" && /<strong>/i.test(node.innerHTML)) {
        const html = node.innerHTML;
        const lines = html.split(/\n+/);
        const dialogueLines = lines.filter((l) =>
          /^\s*<strong>[^<]+<\/strong>\s*[:：]/.test(l.trim())
        );
        if (dialogueLines.length >= 1) {
          const container = document.createElement("div");
          container.className = "dialogue-block";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            // Speaker line: <strong>Name</strong>: body
            const m = line.match(/^<strong>([^<]+)<\/strong>\s*[:：]\s*([\s\S]*)$/);
            // Scene-only bold heading like <strong>場面1: ホテル</strong>
            const sceneOnly = line.match(/^<strong>([\s\S]+?)<\/strong>\s*$/);
            if (m) {
              const name = m[1].trim();
              const body = m[2].trim();
              if (/^(場面|シーン|Scene)/i.test(name)) {
                const div = document.createElement("div");
                div.className = "dialogue-scene";
                div.innerHTML =
                  "<span class=\"dialogue-scene-label\">" +
                  escapeAttr(name) +
                  "</span>" +
                  (body ? "<span class=\"dialogue-scene-body\">: " + body + "</span>" : "");
                container.appendChild(div);
              } else {
                if (!speakers.has(name)) speakers.set(name, nextIdx++);
                const idx = speakers.get(name);
                const bubble = document.createElement("div");
                bubble.className =
                  "dialogue-line dialogue-speaker-" + Math.min(idx, 6);
                bubble.innerHTML =
                  '<span class="dialogue-name">' +
                  escapeAttr(name) +
                  '</span><span class="dialogue-text">' +
                  body +
                  "</span>";
                container.appendChild(bubble);
              }
            } else if (sceneOnly) {
              const name = sceneOnly[1].trim();
              const isScene = /^(場面|シーン|Scene)/i.test(name);
              const div = document.createElement("div");
              div.className = isScene ? "dialogue-scene" : "dialogue-aside";
              div.innerHTML = isScene
                ? '<span class="dialogue-scene-label">' + escapeAttr(name) + "</span>"
                : line;
              container.appendChild(div);
            } else {
              const div = document.createElement("div");
              div.className = "dialogue-aside";
              div.innerHTML = line;
              container.appendChild(div);
            }
          }
          node.replaceWith(container);
        }
      }
      node = next;
    }
  }

  // ---------- Sprint ----------
  function enhanceSprint(article) {
    const h3s = article.querySelectorAll("h3");
    h3s.forEach((h3) => {
      if (!/瞬間.*翻訳|翻訳.*スプリント/.test(h3.textContent || "")) return;
      if (h3.dataset.sprintDone === "1") return;
      h3.dataset.sprintDone = "1";
      processSprintAfter(h3);
    });
  }

  function processSprintAfter(h3) {
    let node = h3.nextElementSibling;
    while (node && !/^H[1-3]$/.test(node.tagName)) {
      const next = node.nextElementSibling;
      if (node.tagName === "P") {
        const html = node.innerHTML;
        const lines = html.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        const titleMatch = lines[0] && lines[0].match(/^<strong>([\s\S]+?)<\/strong>$/);
        const rest = titleMatch ? lines.slice(1) : lines;
        const numbered = rest.filter((l) => /^\d+\.\s/.test(l));
        if (titleMatch && numbered.length >= 1) {
          const setBlock = document.createElement("div");
          setBlock.className = "sprint-set";
          const header = document.createElement("div");
          header.className = "sprint-set-title";
          header.innerHTML = titleMatch[1];
          setBlock.appendChild(header);

          for (const line of rest) {
            const m = line.match(/^(\d+)\.\s*([\s\S]+)$/);
            if (!m) continue;
            const num = m[1];
            const body = m[2];
            const arrowSplit = body.split(/\s*→\s*/);
            const card = document.createElement("div");
            card.className = "sprint-card";
            const numBadge =
              '<span class="sprint-num">' + num + "</span>";
            if (arrowSplit.length >= 2) {
              const left = arrowSplit[0];
              const right = arrowSplit.slice(1).join(" → ");
              card.innerHTML =
                numBadge +
                '<div class="sprint-content">' +
                '<div class="sprint-en">' + left + "</div>" +
                '<div class="sprint-arrow" aria-hidden="true">↓</div>' +
                '<div class="sprint-ja">' + right + "</div>" +
                "</div>";
            } else {
              card.innerHTML =
                numBadge +
                '<div class="sprint-content"><div class="sprint-en">' +
                body +
                "</div></div>";
            }
            setBlock.appendChild(card);
          }
          node.replaceWith(setBlock);
        }
      }
      node = next;
    }
  }

  // ---------- Key phrases / lists ----------
  function enhanceKeyPhrases(article) {
    const h3s = article.querySelectorAll("h3");
    h3s.forEach((h3) => {
      if (!/キーフレーズ/.test(h3.textContent || "")) return;
      let node = h3.nextElementSibling;
      while (node && !/^H[1-3]$/.test(node.tagName)) {
        if (node.tagName === "UL") {
          node.classList.add("keyphrase-list");
        }
        node = node.nextElementSibling;
      }
    });
  }

  // ---------- Scenario intro: 「今日のゴール: ～」 banner ----------
  function enhanceScenarioIntro(article) {
    const h3s = article.querySelectorAll("h3");
    h3s.forEach((h3) => {
      if (!/シナリオ導入/.test(h3.textContent || "")) return;
      let node = h3.nextElementSibling;
      while (node && !/^H[1-3]$/.test(node.tagName)) {
        if (
          node.tagName === "P" &&
          /^<strong>(?:今日.*ゴール|ゴール|Today.*Goal)/i.test(node.innerHTML.trim())
        ) {
          node.classList.add("goal-banner");
        }
        node = node.nextElementSibling;
      }
    });
  }

  // ---------- 文法ポイント (💡) info box ----------
  function enhanceGrammarPoint(article) {
    const ps = article.querySelectorAll(".md-typeset p, .md-content p");
    ps.forEach((p) => {
      const t = p.textContent || "";
      if (/^\s*💡/.test(t)) {
        p.classList.add("grammar-tip");
      }
    });
  }

  // ---------- AI practice template (⑤): wrap code block with header ----------
  function enhanceAITemplate(article) {
    const h3s = article.querySelectorAll("h3");
    h3s.forEach((h3) => {
      if (!/AI練習|AIテンプレート/.test(h3.textContent || "")) return;
      let node = h3.nextElementSibling;
      while (node && !/^H[1-3]$/.test(node.tagName)) {
        if (
          node.tagName === "DIV" &&
          node.classList.contains("highlight")
        ) {
          node.classList.add("ai-template");
          break;
        }
        if (node.tagName === "PRE") {
          node.classList.add("ai-template");
          break;
        }
        node = node.nextElementSibling;
      }
    });
  }

  // ---------- Romaji augmentation ----------
  // Adds a romaji reading under each key-phrase headword and each sprint Japanese line.
  function addRomaji(article) {
    if (typeof window.wanakana === "undefined") return;

    // ② Key phrases: <ul class="keyphrase-list"> > li > <strong>headword</strong>
    article
      .querySelectorAll("ul.keyphrase-list > li > strong:first-child")
      .forEach((el) => {
        if (el.dataset.romajied === "1") return;
        const ja = el.textContent || "";
        const romaji = jaToRomaji(ja);
        if (!romaji || !hasJa(ja)) return;
        el.dataset.romajied = "1";
        const span = document.createElement("span");
        span.className = "romaji romaji-inline";
        span.textContent = romaji;
        // Insert after the <strong>
        el.parentNode.insertBefore(span, el.nextSibling);
      });

    // ④ Sprint cards: .sprint-ja
    article.querySelectorAll(".sprint-ja").forEach((el) => {
      if (el.dataset.romajied === "1") return;
      const ja = el.textContent || "";
      const romaji = jaToRomaji(ja);
      if (!romaji || !hasJa(ja)) return;
      el.dataset.romajied = "1";
      const div = document.createElement("div");
      div.className = "romaji";
      div.textContent = romaji;
      el.parentNode.insertBefore(div, el.nextSibling);
    });
  }

  function hasJa(s) {
    return /[぀-ヿ一-龯]/.test(s);
  }

  function jaToRomaji(text) {
    if (!text) return "";
    // 1) 漢字（ふりがな） → ふりがな（前後にスペース挿入し、単語境界として扱う）
    let s = text.replace(
      /([一-龯々]+[぀-ゟ]*)（([぀-ゟ゠-ヿ]+)）/g,
      " $2 "
    );
    // 2) 文字種境界（ひらがな↔カタカナ）にスペース
    s = s.replace(/([぀-ゟ])([゠-ヿ])/g, "$1 $2");
    s = s.replace(/([゠-ヿ])([぀-ゟ])/g, "$1 $2");
    // 3) 「〜」「・」記号の周辺にスペース（独立記号として扱う）
    s = s.replace(/([〜・])/g, " $1 ");
    // 4) 句読点の後にスペース
    s = s.replace(/([。、！？!?])/g, "$1 ");
    // 4b) 連続する数字の前後にスペース（混在ローマ字との区別）
    s = s.replace(/(\d+)/g, " $1 ");
    // (Note: 単一助詞や2文字助詞の機械的分割は誤分割が多発するため行わない。
    //  「漢字（読み）」境界とカタカナ↔ひらがな境界のみで自然な単語分割を得る。)
    // 5) wanakana で変換
    try {
      let r = window.wanakana.toRomaji(s);
      // 6) 整形: 連続スペースを 1 つに
      r = r.replace(/\s+/g, " ").trim();
      // 句読点の前のスペースを除去
      r = r.replace(/\s+([.,!?])/g, "$1");
      return r;
    } catch (e) {
      return "";
    }
  }

  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
})();
