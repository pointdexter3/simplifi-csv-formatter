// I case anyone is tired of waiting for Simplifi to fix it's rules (I mean honestly the rules feels like the main selling point 😔)


// Re-opening and saving each rule via the edit form forces the rules engine to re-evaluate,
// the below script automatically does the 5 or so clicks per rule (which would be quite time consuming to be done manually on hundreds of rules.
// (I'm sure the delays could be less but for my purposes it's fine)


// USAGE (after one time setup below):
// Go to the Simplifi Rules page.Click the bookmarklet (see BOOKMARKLET STRING at bottom).
// Keep the Simplifi browser tab open (I don't know if will run or not if you background it)
// A status overlay appears displaying the progress
// Wait for it to finish (5 min per 100 rules)




// SETUP:
// copy the entire line below starting with "javascript:" (don't include the leading "//").
// save into the URL field of a new Chrome bookmark (bookmarklet how to guide https://www.freecodecamp.org/news/what-are-bookmarklets/)


// javascript:(async function(){const delay=ms=>new Promise(r=>setTimeout(r,ms));function waitForElement(s,t){t=t||8000;return new Promise(function(res,rej){var d=Date.now()+t,iv=setInterval(function(){var e=document.querySelector(s);if(e){clearInterval(iv);res(e);return;}if(Date.now()>d){clearInterval(iv);rej(new Error('Timeout: '+s));}},200);});}function waitForElementGone(s,t){t=t||8000;return new Promise(function(res,rej){var d=Date.now()+t,iv=setInterval(function(){var e=document.querySelector(s);if(!e){clearInterval(iv);res();return;}if(Date.now()>d){clearInterval(iv);rej(new Error('Timeout gone: '+s));}},200);});}var rl=document.querySelector('#rules-list');if(!rl){alert('Could not find #rules-list');return;}var total=document.querySelectorAll('[id="rules-list-three-dot-menu"]').length;if(!total){alert('No rule menu buttons found');return;}var ov=document.createElement('div');ov.style.cssText='position:fixed;top:16px;right:16px;z-index:999999;background:#1a1a2e;color:#e0e0ff;font:14px/1.5 monospace;padding:12px 18px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.5);min-width:260px;pointer-events:none';document.body.appendChild(ov);var skipped=0;for(var i=0;i<total;i++){ov.innerHTML='<b>Simplifi Rule Updater</b><br>Rule '+(i+1)+' / '+total+'&hellip;';try{var btns=document.querySelectorAll('[id="rules-list-three-dot-menu"]');if(!btns[i])throw new Error('btn missing at '+i);btns[i].click();await delay(600);var ed=await waitForElement('#edit-rule');ed.click();await delay(800);var s1=await waitForElement('#rule-form-submit-button');s1.click();await delay(800);var s2=await waitForElement('#rule-form-submit-button');s2.click();await waitForElementGone('#rule-form-submit-button',8000);await delay(600);}catch(e){console.warn('[Simplifi Updater] Rule '+(i+1)+' skipped:',e.message);skipped++;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await delay(800);}}ov.remove();alert('Simplifi Rule Updater done!\n\n'+(total-skipped)+' of '+total+' rules updated.'+(skipped>0?'\n'+skipped+' skipped - see F12 console.':''));})();





// unminified version below for readability and debugging (also easier to modify if needed, e.g. if Simplifi changes their UI again)
(async function () {

  // --- Helpers ---

  const delay = ms => new Promise(r => setTimeout(r, ms));

  function waitForElement(selector, timeout) {
    timeout = timeout || 8000;
    return new Promise(function (resolve, reject) {
      var deadline = Date.now() + timeout;
      var iv = setInterval(function () {
        var el = document.querySelector(selector);
        if (el) { clearInterval(iv); resolve(el); return; }
        if (Date.now() > deadline) {
          clearInterval(iv);
          reject(new Error('Timeout waiting for: ' + selector));
        }
      }, 200);
    });
  }

  function waitForElementGone(selector, timeout) {
    timeout = timeout || 8000;
    return new Promise(function (resolve, reject) {
      var deadline = Date.now() + timeout;
      var iv = setInterval(function () {
        var el = document.querySelector(selector);
        if (!el) { clearInterval(iv); resolve(); return; }
        if (Date.now() > deadline) {
          clearInterval(iv);
          reject(new Error('Timeout waiting for removal of: ' + selector));
        }
      }, 200);
    });
  }

  // --- Progress overlay ---

  function createOverlay() {
    var div = document.createElement('div');
    div.id = '__simplifi-progress';
    div.style.cssText = [
      'position:fixed', 'top:16px', 'right:16px', 'z-index:999999',
      'background:#1a1a2e', 'color:#e0e0ff', 'font:14px/1.5 monospace',
      'padding:12px 18px', 'border-radius:8px',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
      'min-width:260px', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(div);
    return div;
  }

  function setOverlay(overlay, text) {
    overlay.innerHTML = '<b>Simplifi Rule Updater</b><br>' + text;
  }

  // --- Sanity checks ---

  var rulesList = document.querySelector('#rules-list');
  if (!rulesList) {
    alert('Could not find #rules-list.\nMake sure you are on the Simplifi Rules page.');
    return;
  }

  var initialButtons = document.querySelectorAll('[id="rules-list-three-dot-menu"]');
  var total = initialButtons.length;
  if (total === 0) {
    alert('No rule menu buttons found.\nMake sure the rules list has finished loading.');
    return;
  }

  // --- Main loop ---

  var overlay = createOverlay();
  var skipped = 0;

  for (var i = 0; i < total; i++) {
    setOverlay(overlay, 'Rule ' + (i + 1) + ' / ' + total + '&hellip;');

    try {
      // Re-query every iteration — the SPA may re-render the list between rounds
      var menuButtons = document.querySelectorAll('[id="rules-list-three-dot-menu"]');
      var menuBtn = menuButtons[i];
      if (!menuBtn) throw new Error('Three-dot button not found at index ' + i);

      // Open the three-dot menu
      menuBtn.click();
      await delay(600);

      // Click "Edit rule"
      var editOption = await waitForElement('#edit-rule');
      editOption.click();
      await delay(800);

      // Step 1 — "Continue to Review"
      var step1 = await waitForElement('#rule-form-submit-button');
      step1.click();
      await delay(800);

      // Step 2 — "Update Rule" (same button ID, form re-rendered)
      var step2 = await waitForElement('#rule-form-submit-button');
      step2.click();

      // Wait for the form to close before moving to the next rule
      await waitForElementGone('#rule-form-submit-button', 8000);
      await delay(600);

    } catch (err) {
      console.warn('[Simplifi Updater] Rule ' + (i + 1) + ' skipped:', err.message);
      skipped++;
      // Dismiss any open modal or dropdown before continuing
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await delay(800);
    }
  }

  // --- Done ---

  overlay.remove();
  var succeeded = total - skipped;
  alert(
    'Simplifi Rule Updater — done!\n\n' +
    succeeded + ' of ' + total + ' rules updated.' +
    (skipped > 0 ? '\n' + skipped + ' rule(s) skipped — see F12 console for details.' : '')
  );

})();