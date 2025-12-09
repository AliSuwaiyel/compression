// ----------------------------------------------------------
// GLOBAL STATE
// ----------------------------------------------------------
let lastAlgo = null;
let lastEncoded = null;
let lastTree = null;
let lastOriginal = "";


// ----------------------------------------------------------
// STATS FUNCTION 
// ----------------------------------------------------------
function updateStats(originalText, compressedData, algo) {

    const origSizeChars = originalText ? originalText.length : 0;

    if (!originalText || !compressedData || !algo) {
        document.getElementById("origSize").textContent = "–";
        document.getElementById("compSize").textContent = "–";
        document.getElementById("ratio").textContent = "–";
        return;
    }

    // convert original text size into bits
    const originalBits = origSizeChars * 8;
    let compressedBits = 0;


    // ----------------------------------------------------------
    // HUFFMAN STATS  
    // ----------------------------------------------------------
    if (algo === "huffman") {

        // compressedData = bitstring
        compressedBits = compressedData.length;

        const ratio = (1 - (compressedBits / originalBits)) * 100;

        document.getElementById("origSize").textContent = originalBits + " bits";
        document.getElementById("compSize").textContent = compressedBits + " bits";
        document.getElementById("ratio").textContent = ratio.toFixed(2) + "%";

        return;
    }


    // ----------------------------------------------------------
    // LZW STATS (SLIDES FORMULA → originalBits / compressedBits)
    // ----------------------------------------------------------
    if (algo === "lzw") {

        // compressedData = array of integer codes
        compressedBits = compressedData.length * 12;   // 12-bit codes

        const ratio = originalBits / compressedBits;

        document.getElementById("origSize").textContent = originalBits + " bits";
        document.getElementById("compSize").textContent = compressedBits + " bits";
        document.getElementById("ratio").textContent = ratio.toFixed(2);

        return;
    }
}



// ----------------------------------------------------------
// ENCODE BUTTON
// ----------------------------------------------------------
function encode() {
    const text = document.getElementById("inputText").value;
    if (!text) return alert("Enter text to encode.");

    const algo = document.querySelector("input[name='algo']:checked");
    if (!algo) return alert("Select an algorithm.");

    lastAlgo = algo.value;
    lastOriginal = text;


    // HUFFMAN
    if (algo.value === "huffman") {

        const result = huffmanEncode(text);

        lastTree = result.tree;
        lastEncoded = result.bits;

        document.getElementById("encodedOutput").value = result.bits;
        document.getElementById("decodedOutput").value = "";

        updateStats(text, result.bits, "huffman");
        return;
    }


    // LZW
    if (algo.value === "lzw") {

        const codes = lzwEncode(text);

        lastEncoded = codes;

        document.getElementById("encodedOutput").value = codes.join(", ");
        document.getElementById("decodedOutput").value = "";

        updateStats(text, codes, "lzw");
        return;
    }
}



// ----------------------------------------------------------
// DECODE BUTTON
// ----------------------------------------------------------
function decode() {
    if (!lastAlgo) return alert("Encode something first.");

    let decoded = "";

    if (lastAlgo === "huffman") {
        decoded = huffmanDecode(lastTree, lastEncoded);
    } else {
        decoded = lzwDecode(lastEncoded);
    }

    document.getElementById("decodedOutput").value = decoded;
}



// ----------------------------------------------------------
// CLEAR BUTTON
// ----------------------------------------------------------
function clearAll() {
    document.getElementById("inputText").value = "";
    document.getElementById("encodedOutput").value = "";
    document.getElementById("decodedOutput").value = "";

    updateStats(null, null, null);

    lastAlgo = null;
    lastEncoded = null;
    lastTree = null;
    lastOriginal = "";
}



// ----------------------------------------------------------
// HUFFMAN IMPLEMENTATION
// ----------------------------------------------------------
class Node {
    constructor(ch, freq, left = null, right = null) {
        this.ch = ch;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function buildTree(text) {
    const freq = {};
    for (let c of text) freq[c] = (freq[c] || 0) + 1;

    let nodes = Object.entries(freq).map(([ch, fr]) => new Node(ch, fr));

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        nodes.push(new Node(null, left.freq + right.freq, left, right));
    }

    return nodes[0];
}

function buildCodeTable(node, prefix = "", table = {}) {
    if (!node.left && !node.right) {
        table[node.ch] = prefix || "0";
    } else {
        buildCodeTable(node.left, prefix + "0", table);
        buildCodeTable(node.right, prefix + "1", table);
    }
    return table;
}

function huffmanEncode(text) {
    const tree = buildTree(text);
    const table = buildCodeTable(tree);

    let bits = "";
    for (let c of text) bits += table[c];

    return { tree, bits };
}

function huffmanDecode(tree, bits) {
    let result = "";
    let node = tree;

    for (let b of bits) {
        node = b === "0" ? node.left : node.right;

        if (!node.left && !node.right) {
            result += node.ch;
            node = tree;
        }
    }
    return result;
}



// ----------------------------------------------------------
// LZW IMPLEMENTATION
// ----------------------------------------------------------
function lzwEncode(str) {
    const dict = {};
    for (let i = 0; i < 256; i++) dict[String.fromCharCode(i)] = i;

    let phrase = "";
    let code = 256;
    const out = [];

    for (let char of str) {
        const combo = phrase + char;
        if (dict[combo] != null) {
            phrase = combo;
        } else {
            out.push(dict[phrase]);
            dict[combo] = code++;
            phrase = char;
        }
    }

    if (phrase) out.push(dict[phrase]);
    return out;
}

function lzwDecode(codes) {
    const dict = {};
    for (let i = 0; i < 256; i++) dict[i] = String.fromCharCode(i);

    let phrase = dict[codes[0]];
    let out = phrase;
    let code = 256;

    for (let i = 1; i < codes.length; i++) {
        const curr = codes[i];
        let entry;

        if (dict[curr] != null) {
            entry = dict[curr];
        } else {
            entry = phrase + phrase[0];
        }

        out += entry;
        dict[code++] = phrase + entry[0];
        phrase = entry;
    }

    return out;
}
