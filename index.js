const version = "1.1.1";
const puppeteer = require("puppeteer");
const {execSync} = require('child_process');
const prompt = require('prompt-sync')();

let mainUrl = '';
let deepness = 3;
let verbose = true;
let omitPrefix = '';
let importanceMap = ["1.0", "0.9", "1", "0.5"];

const fs = require('fs');
let urls = [];
let titles = [];
let levels = [];
let browser, page;
let index = 0;
let time = 0;
let start, end = 0;

async function main(){
	start = new Date().getTime();
	console.clear();
	console.log("  __    _     ____      _      _   __    ___   ____  ___   ___       _  _____");
	console.log(" / /\\  | |   | |_      | |\\ | | | / /`_ | |_) | |_  | | \\ / / \\     | |  | | ");
	console.log("/_/--\\ |_|__ |_|       |_| \\| |_| \\_\\_/ |_| \\ |_|__ |_|_/ \\_\\_/     |_|  |_| ");
	console.log("");
	console.log("\x1b[34mNigredo Crawler v" + version + '\x1b[0m');
	console.log("");
	console.log("The Nigredo Crawler Sitemap Generator Console Application is a powerful tool designed to create sitemaps for websites that utilize dynamic content rendering, such as those built with Angular or similar JavaScript frameworks. Unlike traditional web crawlers that rely solely on parsing the DOM (Document Object Model) of a webpage, this application employs a sophisticated approach to discover and map out dynamic content.");
	console.log("");

	let startCrawl = true;
	
	console.log("Please fill the options to start the crawler");
	console.log("Remember to include the protocol (http or https) in the starting URL");
	mainUrl = prompt('Starting URL (required): ');
	if (!mainUrl.endsWith("/")) mainUrl = mainUrl + '/';

	deepness = parseInt(prompt('Deepness (required): '));
	
	console.log("If you want to avoid the program to craw a group of pages, please write the prefix of it");
	omitPrefix = prompt("Prefix to Omit: ");
	
	console.log("The importance map is a list of comma separated floats of the levels of deepness");
	console.log("* You must write a list of " + (deepness + 1) + " numbers");
	importanceMap = prompt("Importance Map (required): ");
	const arrMap = importanceMap.split(",");
	importanceMap = arrMap.map((v) => v.trim());
	
	const verboseInput = prompt('Verbose (Y | N): ');
	if (verboseInput.toLowerCase() == "y") verbose = true;
	else verbose = false;

	if (mainUrl == "" || deepness <= 0 || isNaN(deepness) || importanceMap.length == 0) startCrawl = false;

	if (startCrawl){
		console.log("\x1b[33mCrawling... please wait patiently...\x1b[0m");
		console.log("");

		urls.push(mainUrl);
		levels[0] = 0;

		browser = await puppeteer.launch();
		page = await browser.newPage();

		crawlPage(mainUrl);
	}else{
		console.log("\x1b[31mERROR: Please fill all required options\x1b[0m");
		prompt('Press any key to start again')
		main();
	}
}
async function crawlPage(url){
	if(verbose) console.log("Page \x1b[34murl: " + url + "\x1b[0m");
	page.setCacheEnabled(false);
	await page.goto(url, {
		waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
	});
	await page.setViewport({width: 1024, height: 800});
	// await page.waitForTimeout(waitTime * 1000);
	const pageTitle = await page.title();
	if(verbose){
		const metrics = await page.metrics();
		console.log("Page \x1b[34mtitle:\x1b[0m " + pageTitle);
		execSync('sleep 0.1');
		
		console.log("\x1b[33mMetrics Documents:\x1b[0m " + metrics.Documents);
		execSync('sleep 0.1');
		console.log("\x1b[33mMetrics Frames:\x1b[0m " + metrics.Frames);
		execSync('sleep 0.1');
		console.log("\x1b[33mMetrics Nodes:\x1b[0m " + metrics.Nodes);
		execSync('sleep 0.1');
		console.log("\x1b[33mMetrics LayoutCount:\x1b[0m " + metrics.LayoutCount);
		execSync('sleep 0.1');
		console.log("\x1b[33mMetrics LayoutDuration:\x1b[0m " + metrics.LayoutDuration);
		execSync('sleep 0.1');
		console.log("\x1b[33mMetrics TaskDuration:\x1b[0m " + metrics.TaskDuration);
		execSync('sleep 0.1');
	}
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
			execSync('sleep 0.2');
		}
	}

	if (verbose) console.log("------------------------");
	index++;
	if(index < urls.length){
		crawlPage(urls[index]);
	} else {
		console.log("");
		console.log("\x1b[31mCrawling Finished");

		end = new Date().getTime();
		minutes = parseInt(((end - start) / 1000) / 60);
		seconds = parseInt(((end - start) / 1000) - (minutes * 60));
		time = minutes.toString().padStart(2, "0") + ':' + seconds.toString().padStart(2, "0");
		console.log("Discovered " + urls.length + " pages in " + time + "\x1b[0m");
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
		console.log("\x1b[31mError Ocurred\x1b[0m");
	    console.error(err);
	  }
		console.log("\x1b[32mXML Sitemap Saved\x1b[0m");
	});
}

main();