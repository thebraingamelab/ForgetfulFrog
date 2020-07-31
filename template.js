let template = (function() {
    "use strict";

    // Private variables
    let _initialized = false;
    const HTML = {

        // Top bar elements
        topBar: document.getElementById("top-bar"),
        pauseBox: document.getElementById("pause-box"),
        helpBox: document.getElementById("help-box"),
        pauseBtn: document.getElementById("pause"),
        helpBtn: document.getElementById("help"),
        allTopBtns: document.querySelectorAll(".bar-button"),

        // Pause menu elements
        pauseMenu: document.getElementById("pause-menu"),
        resumeBtn: document.getElementById("resume"),
        restartBtn: document.getElementById("restart"),
        exitBtn: document.getElementById("exit"),
        miniMusicBtn: document.getElementById("music-mini"),
        miniVolumeBtn: document.getElementById("volume-mini"),
        miniHelpBtn: document.getElementById("help-mini"),

        // Help menu elements
        helpMenu: document.getElementById("help-menu"),
        helpBackBtn: document.getElementById("help-back"),
        reportBtn: document.getElementById("report-a-bug"),
        tutorialBtn: document.getElementById("tutorial"),

        // Not implemented menu elements
        notImplementedMenu: document.getElementById("not-implemented-menu"),
        notImplementedBackBtn: document.getElementById("not-implemented-back"),

        // Confirmation menu elements
        confirmationMenu: document.getElementById("confirmation-menu"),
        confirmationYesBtn: document.getElementById("confirmation-yes"),
        confirmationBackBtn: document.getElementById("confirmation-back"),

        // The background dimmer
        dimmer: document.getElementById("dimmer")

    };
    

    // Private (exposed) variables
    let _paused = false;
    let _topBarBoxSize = 0;

    // Functions
    function _init() {

        if (!_initialized) {
            _initialized = true;
            
            // Button events
            HTML.pauseBtn.addEventListener("click", function() { _showMenu(HTML.pauseMenu); }, false);
            
            HTML.resumeBtn.addEventListener("click", function() { _hideMenu(HTML.pauseMenu); }, false);
            HTML.restartBtn.addEventListener("click", _pauseToNotImplemented, false);
            HTML.exitBtn.addEventListener("click", _pauseToNotImplemented, false);

            HTML.miniMusicBtn.addEventListener("click", _pauseToNotImplemented, false);
            HTML.miniVolumeBtn.addEventListener("click", _pauseToNotImplemented, false);
            HTML.miniHelpBtn.addEventListener("click", function() { _switchMenu(HTML.pauseMenu, HTML.helpMenu); }, false);


            HTML.helpBtn.addEventListener("click", function() { _showMenu(HTML.helpMenu); }, false);
            HTML.reportBtn.addEventListener("click", _helpToNotImplemented, false);
            HTML.tutorialBtn.addEventListener("click", _helpToNotImplemented, false);
            HTML.helpBackBtn.addEventListener("click", function() { _switchMenu(HTML.helpMenu, HTML.pauseMenu); }, false);

            HTML.notImplementedBackBtn.addEventListener("click", function() { _switchMenu(HTML.notImplementedMenu, HTML.pauseMenu); }, false);

            _resizeBarButtons();
        }

    }

    // Specifically switches from help menu to not implemented menu
    function _helpToNotImplemented() {
        _switchMenu(HTML.helpMenu, HTML.notImplementedMenu);
    }

    // Specifically switches from pause menu to not implemented menu
    function _pauseToNotImplemented() {
        _switchMenu(HTML.pauseMenu, HTML.notImplementedMenu);
    }

    // Animates a menu to pop out and remain visible
    function _showMenu(menuElement) {

        // Show the menu
        menuElement.style.display = "block";
        menuElement.classList.remove("center-popin");
        menuElement.classList.add("center-popout");

        // Dim the background
        HTML.dimmer.classList.remove("partial-fade-out");
        HTML.dimmer.classList.add("partial-fade-in");
        HTML.dimmer.style.display = "block";

        // Hide the top bar
        HTML.topBar.style.display = "none";
    }

    // Animates a menu to pop in and stay invisible
    function _hideMenu(menuElement) {
        // Hide the menu
        menuElement.classList.remove("center-popout");
        menuElement.classList.add("center-popin");

        menuElement.addEventListener("animationend", function hideMenuElement() {
            menuElement.style.display = "none";
            menuElement.removeEventListener("animationend", hideMenuElement);
        }, false);

        // Undim the background
        HTML.dimmer.classList.remove("partial-fade-in");
        HTML.dimmer.classList.add("partial-fade-out");

        HTML.dimmer.addEventListener("animationend", function hideDimmer() {
            HTML.dimmer.style.display = "none";
            HTML.dimmer.removeEventListener("animationend", hideDimmer);
        }, false);

        // Show the top bar
        HTML.topBar.style.display = "block";
    }

    // Animates the current menu to pop in and stay invisible, while the
    // next menu pops out and remains visible
    function _switchMenu(currentMenu, nextMenu) {

        // Hide current menu
        currentMenu.classList.remove("center-popout");
        currentMenu.classList.add("center-popin");

        // Set display: none after animation pops it away
        currentMenu.addEventListener("animationend", function hideCurrent() {
            currentMenu.style.display = "none";
            currentMenu.removeEventListener("animationend", hideCurrent);
        }, false);

        // After current menu's animation ends, show next menu
        currentMenu.addEventListener("animationend", function showNextMenu() {
            nextMenu.style.display = "block";
            nextMenu.classList.remove("center-popin");
            nextMenu.classList.add("center-popout");

            currentMenu.removeEventListener("animationend", showNextMenu);
        }, false);
    }

    // The function for sizing the top bar buttons
    function _resizeBarButtons() {
        const BUTTON_SIZE_FACTOR = 1.20;
        let barHeight, originalDisplay;

        // Store display setting
        originalDisplay = HTML.topBar.style.display;

        // In case top bar isn't visible (which means clientHeight === 0),
        // temporarily make it visible to calculate true height
        HTML.topBar.style.display = "block";
        barHeight = HTML.topBar.clientHeight;
        HTML.topBar.style.display = originalDisplay;

        // Box size is slightly larger than the bar (120% of height)
        _topBarBoxSize = barHeight * BUTTON_SIZE_FACTOR;

        // Set styles
        for (let i = HTML.allTopBtns.length-1; i >= 0; i--) {
            HTML.allTopBtns[i].style.height = _topBarBoxSize + "px";
            HTML.allTopBtns[i].style.width = _topBarBoxSize + "px";
        }
    }

    // Remove not implemented event listeners on a button
    function _removeNotImplemented(button) {
        button.removeEventListener("click", _pauseToNotImplemented);
        button.removeEventListener("click", _helpToNotImplemented);
    }

    // Search an element's parents, grandparents, etc. for a menu
    function _findParentMenu(child) {
        
        // Only begin search if there is a parent
        if (child && child.parentElement) {

            // If the parent is a menu, return it
            if (child.parentElement.classList.contains("menu")) {
                return child.parentElement;
            }

            // Otherewise, continue search up the tree
            else {
                _findParentMenu(child.parentElement);
            }

        }

        // No parent, return null
        else {
            console.log("Error: no parent is a menu.");
            return null;
        }

    }

    // Add a confirmation menu to a button
    function _addConfirm(button, confirmText, callback) {
        
        // Keep going up the parent tree until the original menu is found
        let originalMenu = _findParentMenu(button);

        // Add click event to the button that takes user to confirmation menu with correct settings
        button.addEventListener("click", function () {
            _switchMenu(originalMenu, HTML.confirmationMenu);

            // Change confirmation text (ie "YES, RESTART");
            HTML.confirmationYesBtn.firstElementChild.textContent = "YES, " + confirmText.toUpperCase();

            // Add click event to confirmation button
            HTML.confirmationYesBtn.addEventListener("click", function confirmed() { 

                _hideMenu(HTML.confirmationMenu);

                HTML.confirmationMenu.addEventListener("animationend", function executeCallback() {
                    HTML.confirmationMenu.removeEventListener("animationend", executeCallback);
                    callback();
                }, false);


                HTML.confirmationYesBtn.removeEventListener("click", confirmed);
            }, false);

            // Add click event to back button
            HTML.confirmationBackBtn.addEventListener("click", function denied() { 
                _switchMenu(HTML.confirmationMenu, originalMenu); 
                HTML.confirmationBackBtn.removeEventListener("click", denied);
            }, false);
        }, false);
    }

    // Navigate to thebraingamelab.org
    function _goToBGL() {
        window.location.assign("https://thebraingamelab.org/");
    }

    // Mutators
    function _setIcon(button, svgId) {
        let use = button.firstElementChild.firstElementChild;
        use.setAttribute("href", "#"+svgId);
    }

    function _pause() {
        _paused = true;
    }

    function _unpause() {
        _paused = false;
    }

    // Accessors
    function _isPaused() {
        return _paused;
    }

    return {
        init: _init,
        resizeBarButtons: _resizeBarButtons,
        addConfirm: _addConfirm,
        removeNotImplemented: _removeNotImplemented,
        goToBGL: _goToBGL,

        showMenu: _showMenu,
        hideMenu: _hideMenu,
        switchMenu: _switchMenu,

        setIcon: _setIcon,
        pause: _pause,
        unpause: _unpause,

        isPaused: _isPaused,

        menus: {
            paused: HTML.pauseMenu,
            help: HTML.helpMenu,
            notImplemented: HTML.notImplementedMenu,
            confirm: HTML.confirmationMenu
        },

        menuButtons: {
            restart: HTML.restartBtn,
            resume: HTML.resumeBtn,
            exit: HTML.exitBtn,
            music: HTML.miniMusicBtn,
            volume: HTML.miniVolumeBtn,
            help: HTML.miniHelpBtn,
            
            tutorial: HTML.tutorialBtn,
            report: HTML.reportBtn,
            back: HTML.helpBackBtn
        }
    };
})();