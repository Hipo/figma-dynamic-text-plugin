// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
let availableTextStyles = [];
let textNodes = [];
let fontNamesByUsage = {};
let availableFontWeights = [];
let availableFontSizes = [];
function collectTextNodeInfo(selection) {
    // Runs through all the node element in the document and
    // fills global variables, textNodes, availableFontNames, availableFontWeights, availableFontSizes
    textNodes = [];
    fontNamesByUsage = {};
    availableFontWeights = [];
    availableFontSizes = [];
    availableTextStyles = figma.getLocalTextStyles();
    function childrenIterator(node) {
        if (node.children) {
            node.children.forEach(child => {
                childrenIterator(child);
            });
        }
        else {
            if (node.type === 'TEXT') {
                let node_data = {
                    "id": node.id,
                    "characters": node.characters,
                    "fontName": node.fontName.family,
                    "fontWeight": node.fontName.style,
                    "fontSize": node.fontSize
                };
                textNodes.push(node_data);
                if (fontNamesByUsage.hasOwnProperty(node_data.fontName)) {
                    // increase count
                    fontNamesByUsage[node_data.fontName] += 1;
                }
                else {
                    fontNamesByUsage[node_data.fontName] = 1;
                }
                if (availableFontWeights.indexOf(node_data.fontWeight) < 0) {
                    availableFontWeights.push(node_data.fontWeight);
                }
                if (availableFontSizes.indexOf(node_data.fontSize) < 0) {
                    availableFontSizes.push(node_data.fontSize);
                }
            }
        }
    }
    selection.forEach(item => childrenIterator(item));
}
function InitUI() {
    collectTextNodeInfo(figma.root.children);
    figma.ui.postMessage({
        type: 'initUI',
        textNodes: textNodes,
        fontNamesByUsage: fontNamesByUsage,
        availableFontWeights: availableFontWeights,
        availableFontSizes: availableFontSizes,
        availableTextStyles: availableTextStyles
    });
}
figma.showUI(__html__);
InitUI();
figma.ui.onmessage = msg => {
    if (msg.type === 'initUIRequest') {
        InitUI();
    }
};
