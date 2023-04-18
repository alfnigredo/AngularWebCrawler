const version = "1.0.1";
const puppeteer = require("puppeteer");
const {execSync} = require('child_process');
const fs = require('fs');
let urls = [];
let titles = [];
let levels = [];
let browser, page;
let index = 0;

const mainUrl = 'https://www.alfnigredotattoos.com/';
const waitTime = 5;
const deepness = 3;
const verbose = false;
const omitPrefix = 'admin/';
const importanceMap = ["1.0", "0.9", "0.5", "0.2"];

async function main(){
	console.clear();
	console.log("\x1b[34mNigredo Crawler v" + version);
	console.log("\x1b[33mCrawling... please wait patiently...\x1b[0m");

	urls.push(mainUrl);
	levels[0] = 0;

	browser = await puppeteer.launch();
	page = await browser.newPage();

	crawlPage(mainUrl);
}
async function crawlPage(url){ 
	await page.goto(url);
	await page.setViewport({width: 1024, height: 800});
	await page.waitForTimeout(waitTime * 1000);
	const pageTitle = await page.title();
	if(verbose) console.log("Page title: " + pageTitle);
	titles[index] = pageTitle;

	const elements = await page.$$('a');
	if(verbose) console.log("- \x1b[33mFound\x1b[0m " + elements.length + " Anchors ");

	for(let element of elements){
		let link = await (await element.getProperty('href')).jsonValue();
		// console.log(link, link.startsWith(mainUrl), !urls.includes(link), levels[index], deepness >= levels[index], !link.startsWith(mainUrl + omitPrefix));
		if(link.startsWith(mainUrl) && !urls.includes(link) && deepness >= levels[index] && !link.includes("#") && !link.startsWith(mainUrl + omitPrefix)){
			if(verbose) console.log("-- \x1b[32mADDED\x1b[0m: " + link);
			urls.push(link);
			levels.push((levels[index]+1));
			execSync('sleep 1');
		}
	}

	index++;
	if(index < urls.length){
		crawlPage(urls[index]);
	}else{
		console.log("\x1b[31mCrawling Finished");
		console.log("Discovered " + urls.length + " pages\x1b[0m");
		// if(verbose) console.log(urls);
		await page.close();
		await browser.close();

		createXml();
	}
}

function createXml(){
	console.log("\x1b[33mBuilding XML\x1b[0m");
	const fecha = new Date();
	let xml = '<?xml version="1.0" encoding="UTF-8"?>' + 
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
	for(let i=0; i < index; i++){
		xml += '<url>' +
			'<loc>' + urls[i] + '</loc>' +
			'<lastmod>' + fecha.toISOString() + '</lastmod>' + 
			'<priority>' + importanceMap[levels[i]] + '</priority>' +
			'<changefreq>monthly</changefreq>' +
		'</url>';
	}
	xml += '</urlset>';

	console.log("\x1b[33mWriting XML\x1b[0m");
	fs.writeFile('sitemap.xml', xml, err => {
	  if (err) {
		console.log("\x1b[32mError Ocurred\x1b[0m");
	    console.error(err);
	  }
		console.log("\x1b[32mXML Sitemap Saved\x1b[0m");
	});
}

main();