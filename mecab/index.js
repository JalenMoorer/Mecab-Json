const { exec } = require('child_process');
const fields = require('./fields.json');
//const setence = '私はフライドチキンを食べた';

function mecab(sentence, res) {
    const command = `echo ${sentence} | mecab`;
    exec(command, (error, stdout, stderr) => {

        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        //console.log(stdout);
        stdout = stdout.split(/\n/);
        //console.log(stdout);
        const japaneseWordList = transformOutput(stdout);
        japaneseWordList.length = japaneseWordList.length - 2;
        const filteredJapaneseWordList = japaneseWordList.filter(item => typeof item !== 'undefined');
        //console.log(japaneseWordList);
        //console.error(`stderr: ${stderr}`);
        res.json(filteredJapaneseWordList);
      });
}

function transformOutput(array){
    const conjugatedObj = {
        isConjugated: false,
    }
    const transformedArray = array.map((item, i) => {

        const tabSplit = item.indexOf('\t');

        let word = item.substring(0, tabSplit + 1);
        word = word.slice(0, word.length -1 );

        if (word.length === 0)
            return;

        const grammarObject = {
            partOfSpeech: '',
            firstPartofSpeech: '',
            secondPartofSpeech: '',
            thirdPartofSpeech: '',
            conjugatedForm: '',
            additionalConjugatedForm: '',
            baseForm: '',
            reading: '',
            pronunciation: ''
        }

        let grammarList;
        let counter = 0;
        grammarList = item.substring(tabSplit + 1).split(",")

        for (let [key] of Object.entries(grammarObject)) {
            if (key === '*')
                continue;
            const fieldsKey = fields[grammarList[counter]];
            grammarObject[key] = `${grammarList[counter]}${fieldsKey ? ' - ' + fieldsKey : ''}`; 
            counter = counter + 1;
        }

        if (!conjugatedObj.isConjugated) {
            if (grammarObject.partOfSpeech.includes("助動詞") && (grammarObject.baseForm === 'です') && !grammarObject.additionalConjugatedForm.includes("基本形")) {
                conjugatedObj.isConjugated = true;
                console.log('Desu word within a verb being built', word, conjugatedObj.isConjugated);
            }
            else if ( (!grammarObject.partOfSpeech.includes("助動詞") && !grammarObject.partOfSpeech.includes("感動詞")) && grammarObject.partOfSpeech.includes("動詞") && !grammarObject.additionalConjugatedForm.includes("基本形") && !grammarObject.firstPartofSpeech.includes("非自立") && !array[i + 1].includes('助詞')) {
                conjugatedObj.isConjugated = true;
                console.log('Beginning of a verb', word, conjugatedObj.isConjugated);
            }
            else if (grammarObject.firstPartofSpeech.includes("サ変接続") && array[i + 1].includes('する')) {
                conjugatedObj.isConjugated = true;
                console.log('Suru verb to be connected', word, conjugatedObj.isConjugated);
            }
        }

        else if (conjugatedObj.isConjugated) {
           /// console.log(grammarObject);
            if (grammarObject.partOfSpeech.includes("動詞") && grammarObject.additionalConjugatedForm.includes("基本形")) {
                conjugatedObj.isConjugated = false;
                console.log('Ending of a verb', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.conjugatedForm.includes("サ変・スル")) {
                conjugatedObj.isConjugated = false;
                console.log('Suru ending of a verb', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.partOfSpeech.includes("形容詞") && grammarObject.firstPartofSpeech.includes("非自立")) {
                conjugatedObj.isConjugated = false;
                console.log('Adjective ending of a verb', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.partOfSpeech.includes("助動詞") && grammarObject.additionalConjugatedForm.includes("仮定形") && !grammarObject.baseForm.includes("ない")) {
                conjugatedObj.isConjugated = false;
                console.log('Tara ending of a verb', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.partOfSpeech.includes("助動詞") && grammarObject.baseForm.includes("ない") && grammarObject.additionalConjugatedForm.includes("未然形")) {
                conjugatedObj.isConjugated = false;
                console.log('Nai ending of a verb', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.partOfSpeech.includes("助詞") && ( word === 'て' && !array[i + 1].includes('も'))) {
                conjugatedObj.isConjugated = false;
                console.log('Te ending', word, conjugatedObj.isConjugated);
            }

            else if (grammarObject.partOfSpeech.includes("助詞") && ( word === 'て' && array[i + 1].includes('も'))) {
                conjugatedObj.isTemo = true;
                console.log('Temo in progress', word, conjugatedObj.isConjugated);
            }

            else if (conjugatedObj.isTemo && word === 'も') {
                conjugatedObj.isTemo = false;
                conjugatedObj.isConjugated = false;
                console.log('Temo ending of a verb', word, conjugatedObj.isConjugated);
            }
        }

        return {
            word,
            grammarObject,
        }
    });
    console.log('-----------')
    return transformedArray;
}

module.exports = mecab;