/*************************************************************
* Function: parseDocumentDataAndReturnBagOfWords
*	Parameters:
*		data : A raw string containing the document content
*		alphabet : The list of permissible characters allowed in the
*					document.
*	Returns:
*		bagOfWords : HashMap of word ad its frequency count computed from the data. 	
*	Description:
*		A function which takes in data and alphabet and constructs
*		a bag of words model containing (word : frequency count)
*		of all the words in the document.
*************************************************************/
function parseDocumentDataAndReturnBagOfWords(data, alphabet){
	var words = data.split(' ');
	var word;
	for(var index in words){
		words[index] = words[index].toLowerCase();
		word = words[index];
		// strip out \n \t
		word = word.replace('\n', '');
		word = word.replace('\t', '');
		// Remove the characters from data which are not present in the alphabet.
		for(var charindex in word){
			if(alphabet.split('').indexOf(word[charindex]) == -1){
				word = word.replace(word[charindex], '');
			}
		}
		words[index] = word;
	}
	var bagOfWords = {};
	for(var wordindex in words){
		if(bagOfWords[words[wordindex]]){
			bagOfWords[words[wordindex]] += 1;
		}
		else{
			bagOfWords[words[wordindex]] = 1;
		}
	}
	return bagOfWords;
}

/*************************************************************
* Function: edit1
*	Parameters:
*		word : The word to which the edits need to computed
*		alphabet : The list of permissible characters allowed in the
*					word.
*	Returns:
*		candidateWordEdit1 : An array of candidate words which are 1 edit distance apart
*			from the given word.
*	Description:
*		A function which takes in word and alphabet and constructs
*		a list of words formed by inserting a character, deleting a character
*		transposing two adjacent characters and replacing a character in the
*		word with an alphabet character.
*************************************************************/
function edit1(word, alphabet){
	var splits = [];
	var inserts = [];
	var deletes = [];
	var transposes = [];
	var replaces = [];
	var word1,word2;
	for(var index in word){
		word1 = word.substring(0,index);
		word2 = word.substring(index);
		if(word1 && word2){
			splits.push([word1, word2]);
		}
	}
	for(var splitIndex in splits){
		word1 = splits[splitIndex][0];
		word2 = splits[splitIndex][1];
		for(var charIndex in alphabet){
			var insertWord = word1+alphabet[charIndex]+word2;
			inserts.push(insertWord);
			var replaceWord = word1+alphabet[charIndex]+word2.substring(1);
			replaces.push(replaceWord);
		}
		if(word2.substring(1)){
			var deleteWord = word1+word2.substring(1);
			deletes.push(deleteWord);
		}
		var transposeWord = word1.substring(0,word1.length-1) + word2[0] + word1[word1.length-1] + word2.substring(1);
		transposes.push(transposeWord);
	}
	var edit1Json = {
		'inserts' : inserts,
		'replaces' : replaces,
		'deletes' : deletes,
		'transposes' : transposes
	};
	var candidateWordEdit1 = [];
	for(var key in edit1Json){
		for(var index in edit1Json[key]){
			candidateWordEdit1.push(edit1Json[key][index]);
		}
	}
	return candidateWordEdit1;
}

/*************************************************************
* Function: correct
*	Parameters:
*		bagOfWords : An array of word frequency count constructed 
*					from the dictionary words.
*		alphabet : The list of permissible characters allowed in the
*					word.
*		chatWord : The word entered by the user.
*	Returns:
*		maxWord : The maximal likelihood correction for the given word from the data.
*	Description:
*		A function which takes in bagOfWords, alphabet, chatWord as input and returns
*		a list of the corrected word which has the maximal likelihood. This function first
*		computes the list of words which are 1 edit distance away from the given word using
*		the function edit1 and then this computes the list of words which are 2 edit distances
*		away by scanning through the list of words which are 1 edit distance away from the given word,
*		then computes the valid words by filtering the edit 1 array and edit 2 array against the dictionary word
*		(computed from the bagOfWords) and finally returns the word which has maximal frequency count from the 
*		valid array.
*************************************************************/
function correct(bagOfWords, alphabet, chatWord){
	var validWords = [];
	for(key in bagOfWords){
		validWords.push(key);
	}
	for(var i in validWords){
		if(validWords[i]==chatWord){
			return chatWord;
		}
	}
	if (validWords.indexOf(chatWord) != -1){
		return chatWord;
	}
	var validEdits = [];
	var edit1Array = edit1(chatWord,alphabet);
	for(var editIndex1 in edit1Array){
		if(validWords.indexOf(edit1Array[editIndex1]) != -1){
			validEdits.push(edit1Array[editIndex1]);
		}
	}

	for(edit1Index in edit1Array){
		var word = edit1Array[edit1Index];
		var edits2ForWord = edit1(word,alphabet);
		for(var editIndex2 in edits2ForWord){
			if(validWords.indexOf(edits2ForWord[editIndex2]) != -1 && validEdits.indexOf(edits2ForWord[editIndex2]) == -1){
				validEdits.push(edits2ForWord[editIndex2]);
			}
		}
	}
	var maxWordCount = 0;
	var maxWord = '';
	for(key in validEdits){
		if(bagOfWords[validEdits[key]] > maxWordCount){
			maxWordCount = bagOfWords[key];
			maxWord = validEdits[key];
		}
	}
	return maxWord;
}

fs = require('fs');
http = require('http');
var sys = require("sys");
console.log("Enter a misspelt word:");
var stdin = process.openStdin();
stdin.setEncoding('utf8');
// big.txt is the file which contains the dictionary words
fs.readFile('big.txt', 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}
	var alphabet = 'abcdefghijklmnopqrstuvwxyz';
	var bagOfWords = parseDocumentDataAndReturnBagOfWords(data, alphabet);
	// Listen on the console, whenever the user types in a word run spell check against it.
	stdin.addListener("data", function(d) {
		console.log("You Have Entered:"+d.toString().substring(0, d.length-1));
		var enteredText = d.toString().substring(0, d.length-1);
		enteredText = enteredText.toLowerCase();
		enteredText = enteredText.replace('\t', '');
		console.log(enteredText);
		var correctedText = correct(bagOfWords, alphabet, enteredText);
		if(correctedText == enteredText){
			console.log(enteredText+" is a dictionary word!!!");
		}
		else{
			console.log("Did you Mean: "+correctedText);
		}
  });
});
