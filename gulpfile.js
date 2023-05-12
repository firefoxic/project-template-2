import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import gulp from "gulp"
import cached from "gulp-cached"
import remember from "gulp-remember"
import server from "browser-sync"
import plumber from "gulp-plumber"
import twig from "gulp-twig"
import htmlmin from "gulp-htmlmin"
import bemlinter from "gulp-html-bemlinter"
import dartSass from "sass"
import gulpSass from "gulp-sass"
import svgo from "gulp-svgmin"
import postcss from "gulp-postcss"
import postUrl from "postcss-url"
import autoprefixer from "autoprefixer"
import csso from "postcss-csso"
import terser from "gulp-terser"
import sharpResponsive from "gulp-sharp-responsive"
import { stacksvg } from "gulp-stacksvg"
import { deleteAsync } from "del"

const { src, dest, watch, series, parallel } = gulp
const sass = gulpSass(dartSass)
const SOURCE_ROOT = `./source/`
const DATA_PATH = `${SOURCE_ROOT}data.json`
const { SERVER_ROOT } = readJsonFile(DATA_PATH)
let isDevelopment = true

function readJsonFile (path) {
	const file = readFileSync(path)
	return JSON.parse(file)
}

export function processMarkup () {
	return src(`${SOURCE_ROOT}*.html`)
		.pipe(twig({
			data: { isDevelopment, ...readJsonFile(DATA_PATH) }
		}))
		.pipe(htmlmin({ collapseWhitespace: !isDevelopment }))
		.pipe(dest(SERVER_ROOT))
		.pipe(server.stream())
}

export function lintBem () {
	return src(`./build/*.html`)
		.pipe(bemlinter())
}

export async function processStyles () {
	const { viewports, images } = readJsonFile(DATA_PATH)
	const sassOptions = {
		functions: {
			"getbreakpoint($bp)": (bp) => new dartSass.types.Number(viewports[bp.getValue()]),
			"getext($name)": (name) => new dartSass.types.String(images[name.getValue()].ext),
			"getmaxdppx($name)": (name) => new dartSass.types.Number(images[name.getValue()].maxdppx),
			"getviewports($name)": function (name) {
				const bps = images[name.getValue()].sizes.map((size) => size.viewport)
				const breakpoints = new dartSass.types.List(bps.length)
				bps.reverse().forEach((vp, i) => { breakpoints.setValue(i, new dartSass.types.String(vp)) })
				return breakpoints
			}
		}
	}

	return src(`${SOURCE_ROOT}sass/*.scss`, { sourcemaps: isDevelopment })
		.pipe(plumber())
		.pipe(sass(sassOptions).on(`error`, sass.logError))
		.pipe(postcss([
			postUrl({ assetsPath: `../` }),
			autoprefixer(),
			csso()
		]))
		.pipe(dest(`${SERVER_ROOT}css`, { sourcemaps: isDevelopment }))
		.pipe(server.stream())
}

export function processScripts () {
	return src(`${SOURCE_ROOT}js/*.js`)
		.pipe(terser())
		.pipe(dest(`${SERVER_ROOT}js`))
		.pipe(server.stream())
}

export function createStack () {
	return src(`${SOURCE_ROOT}icons/**/*.svg`)
		.pipe(cached(`icons`))
		.pipe(remember(`icons`))
		.pipe(svgo())
		.pipe(stacksvg())
		.pipe(dest(`${SERVER_ROOT}icons`))
}

export function optimizeImages () {
	if (!isDevelopment) {
		return src(`${SOURCE_ROOT}img/**/*.{jpg,png}`)
			.pipe(sharpResponsive({
				formats: [
					{},
					{
						format: `webp`
					},
					{
						format: `avif`
					}
				]
			}))
			.pipe(dest(`${SERVER_ROOT}img`))
	} else {
		return src(`${SOURCE_ROOT}img/**/*.{jpg,png}`)
			.pipe(cached(`images`))
			.pipe(remember(`images`))
			.pipe(dest(`${SERVER_ROOT}img`))
	}
}

const ASSETS_PATHS = [
	`${SOURCE_ROOT}fonts/*.{woff2,woff}`,
	`${SOURCE_ROOT}*.ico`,
	`${SOURCE_ROOT}img/**/*.svg`,
	`${SOURCE_ROOT}favicons/*`,
	`${SOURCE_ROOT}*.webmanifest`
]

export function copyAssets () {
	return src(ASSETS_PATHS, { base: SOURCE_ROOT })
		.pipe(cached(`assets`))
		.pipe(remember(`assets`))
		.pipe(dest(SERVER_ROOT))
		.pipe(server.stream())
}

export async function removeBuild () {
	await deleteAsync(SERVER_ROOT)
}

function reloadServer (done) {
	server.reload()
	done()
}

export function startServer () {
	server.init({
		server: {
			baseDir: SERVER_ROOT
		},
		cors: true,
		notify: false,
		ui: false
	})

	watch(`${SOURCE_ROOT}**/*.{html,twig}`, series(processMarkup))
	watch(`${SOURCE_ROOT}sass/**/*.scss`, series(processStyles))
	watch(`${SOURCE_ROOT}js/**/*.js`, series(processScripts))
	watch(`${SOURCE_ROOT}icons/**/*.svg`, series(createStack, reloadServer))
		.on(`unlink`, takeOutTheTrash(`icons`))
	watch(`${SOURCE_ROOT}img/**/*.{jpg,png}`, series(optimizeImages, reloadServer))
		.on(`unlink`, takeOutTheTrash(`images`))
	watch(ASSETS_PATHS, series(copyAssets))
		.on(`unlink`, takeOutTheTrash(`assets`))
	watch(`${SOURCE_ROOT}data.json`, parallel(processStyles, processMarkup, optimizeImages))

	function takeOutTheTrash(cacheName) {
		return (filepath) => {
			remember.forget(cacheName, resolve(filepath))
			delete cached.caches[cacheName][resolve(filepath)]
			deleteAsync(`./${filepath}`.replace(SOURCE_ROOT, SERVER_ROOT))
		}
	}
}

export function compileProject (done) {
	parallel(
		processStyles,
		processMarkup,
		processScripts,
		createStack,
		copyAssets,
		optimizeImages
	)(done)
}

export function buildProd (done) {
	isDevelopment = false
	series(
		removeBuild,
		compileProject
	)(done)
}

export function runDev (done) {
	series(
		compileProject,
		startServer
	)(done)
}
