// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
let availableTextStyles = [];
let textNodesWithoutFontFamily = [];
let textNodes = [];
let fontNamesByUsage = {};
let availableFontWeights: string[] = [];
let availableFontSizes: number[] = [];

function collectTextNodeInfo(selection) {
    // Runs through all the node element in the document and
    // fills global variables, textNodes, availableFontNames, availableFontWeights, availableFontSizes
    textNodes = [];
    fontNamesByUsage = {};
    availableFontWeights = [];
    availableFontSizes = [];
    figma.getLocalTextStyles().forEach(function(style){
        availableTextStyles.push({
            id: style.id,
            name: style.name
        });
    });

	function childrenIterator(node) {
		if (node.children) {
			node.children.forEach(child => {
			childrenIterator(child)
		})
		} else {
			if (node.type === 'TEXT') {
			    let node_data = {
                    "id": node.id,
                    "characters": node.characters,
                    "fontName": node.fontName.family,
                    "fontWeight": node.fontName.style,
                    "fontSize": node.fontSize
                };

			    if (node.fontName.family){
			        textNodes.push(node_data);

                    if (fontNamesByUsage.hasOwnProperty(node_data.fontName)){
                        // increase count
                        fontNamesByUsage[node_data.fontName] += 1
                    }else {
                        fontNamesByUsage[node_data.fontName] = 1
                    }

                    if (availableFontWeights.indexOf(node_data.fontWeight) < 0){
                        availableFontWeights.push(node_data.fontWeight);
                    }
                    if (availableFontSizes.indexOf(node_data.fontSize) < 0){
                        availableFontSizes.push(node_data.fontSize);
                    }

                }else {
			        textNodesWithoutFontFamily.push(node_data)
                }

			}

		}
	}

	selection.forEach(item => childrenIterator(item))
}

function createNewStyle(textNodes) {
    if (textNodes.length > 0) {
        console.log(figma.getNodeById(textNodes[0].id));
        let textNode = <TextNode>figma.getNodeById(textNodes[0].id);
        let textNodeFont = <FontName>textNode.fontName;

        figma.loadFontAsync({family: textNodeFont.family, style: textNodeFont.style}).then(value1 => {

            let newTextStyle = figma.createTextStyle();
            newTextStyle.name = "undefined";
            newTextStyle.fontName = textNodeFont;
            newTextStyle.fontSize = <number>textNode.fontSize;

            textNodes.forEach(value => {
                let textNode = <TextNode>figma.getNodeById(value.id);
                textNode.textStyleId = newTextStyle.id
            })
        });
    }
}


function assignToStyle(textNodes, textStyleId: string) {
    textNodes.forEach(value => {
        let textNode = <TextNode>figma.getNodeById(value);
        textNode.textStyleId = textStyleId
    })
}

function InitUI() {
    collectTextNodeInfo(figma.root.children);
    figma.ui.postMessage({
        type: 'initUI',
        textNodes:textNodes,
        textNodesWithoutFontFamily:textNodesWithoutFontFamily,
        fontNamesByUsage: fontNamesByUsage,
        availableFontWeights: availableFontWeights,
        availableFontSizes: availableFontSizes,
        availableTextStyles: availableTextStyles
    });
}

figma.showUI(__html__);

InitUI();

figma.ui.onmessage = msg => {
    if (msg.type === 'create-new-style') {
        let textNodeList = msg.filteredTextNodes;
        createNewStyle(textNodeList)
    }

    if (msg.type === 'assign-to-selected-style') {
        let textNodeList = msg.filteredTextNodes;
        let textStyleId = msg.textStyleId;
        assignToStyle(textNodeList, textStyleId)
    }
};
