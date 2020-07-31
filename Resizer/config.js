let config = {

   /*
   ** The HTML id of the canvas for the game.
   **
   ** Options: any string, or an array of strings (if using multiple canvases),
   **          or the empty string ( "" ) if not using canvas
   */
   canvasId: ["game-canvas","game-canvas-buffer","frog-canvas","frog-canvas-buffer","pad-canvas"],


   /*
   ** The HTML id of the canvas wrapper.
   ** The wrapper is resized while the canvas just fits the wrapper.
   **
   ** Options: any string, or the empty string ( "" ) if not using canvas wrapper and/or canvas
   */
  wrapperId: "canvas-wrapper",

   /*
   ** The HTML id of the container for the game.
   **
   ** Options: any string
   */
   containerId: "game-container",

   /*
    ** Minimum amount of time in milliseconds between each execution of resize code.
    ** This is particularly useful in performance when a window might be
    ** resized many times in a short time frame.
    **
    ** Options: any real number
    */
   resizeDelay: 250,

    /*
    ** The position of the canvas within the container (applicable to canvas only).
    **
    ** Options: "top left",     "top center",     "top right"
    **          "center left",  "center center",  "center right"
    **          "bottom left",  "bottom center",  "bottom right"
    */
    canvasPosition: "bottom center",

    
    /*
    ** Whether the canvas should stretch to fit the container
    ** or whether it should maintain aspect ratio (applicable to canvas only).
    **
    ** Options: true, false
    */
    stretchToFit: false,

    /*
    ** Whether the canvas drawing operations should scale to look sharper
    ** on retina displays (which have high device pixel ratios (DPRs).
    ** WARNING: may cause a decrease in performance.
    **
    ** Options: true, false
    */
   scaleByDPR: false,

    /*
    ** The orientation of the game (applicable to canvas only).
    **
    ** Options: "portrait", "landscape", "both"
    */
   orientation: "portrait",

    /*
    ** The width and height of the ingame field of play.
    ** It is thus also the ideal width and height of the canvas if it is to
    ** maintain aspect ratio (applicable to canvas only).
    **
    ** Options: any real number
    */
   gameFieldWidth: 540,
   gameFieldHeight: 960
    
};

