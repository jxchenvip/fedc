#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cwd = process.cwd(); // dir 为全局变量初始为执行目录
const lib = path.join(__dirname, '../lib'); // 保存目录
const utils = path.join(__dirname, '../lib/utils'); // 保存目录
const tpl = path.join(__dirname, '../lib/tpl'); // 保存目录
const tpl2 = path.join(__dirname, '../lib/tpl2'); // 保存目录
const color = require('../lib/utils/color'); // 设置颜色 
const pkg = require('../package.json'); // 读取package.json
const childProcess = require('child_process');
const writeFileName = ',';
const configFileName = 'webpack.config.js';
const exes = {
    branches: 'webpack -w',
    trunk: 'webpack',
    path: 'webpack ',
    mpath: 'webpack -w' // 
};

var dos = exes.branches;
/**
 * 整理入参数
 */
var argvs = process.argv.reduce((o, key, index, arr) => {
    var k = key.replace(/^-/, '').toLowerCase();
    if (/^\[.+\]$/.test(k)) { // 自定义命令
        o['define'] = k.replace(/[\[\]]/g, '');
    } else if (/^\${2}/.test(k)) { // mpath
        o['$$'] = k.replace(/^\${2}/, '');
    } else if (/^\$/.test(k)) {
        o['$'] = k.replace(/^\$/, ''); // path
    } else {
        o[k] = k;
    }
    return o;
}, {});

/** 帮助 */
if (argvs.h) {
    console.log(`${color.TIP} fedc`);
    console.log(`${color.TIP} -h help`);
    console.log(`${color.TIP} -v version`);
    console.log(`${color.TIP} -branches 压缩到branches分支带map文件`);
    console.log(`${color.TIP} fedc branches默认压缩到branches`);
    console.log(`${color.TIP} -trunk 压缩到trunk分支不带map文件`);
    console.log(`${color.TIP} fedc trunk`);
    console.log(`${color.TIP} -$ 压缩到指定路径带map文件`);
    console.log(`${color.TIP} fedc $c:/a/b`);
    console.log(`${color.TIP} $$ 压缩到指定路径不带map文件`);
    console.log(`${color.TIP} fedc $$c:/a/b`);
    console.log(`${color.TIP} [webpack命令]`);
    console.log(`${color.TIP} fedc [webpack,-d,-w,--color]方括号内不能有空格`);
    console.log(`${color.TIP}  [webpack,-d,-w,--color]方括号内不能有空格`);
    // console.log(`${color.TIP} -reset 备份webpack.config.js,package.json`);
    process.exit();
}

/** 版本号 */
if (argvs.v) {
    console.log(pkg.version);
    process.exit();
}

/** 备份配置文件 */
if (argvs.reset) {
    resetConfigJs(tpl);
    return;
}

/** 备份配置文件 */
if (argvs.reset2) {
    resetConfigJs(tpl2);
    return;
}

var content = {};

// 移动到branches分支，生成map文件
if (argvs.branches) {
    content.name = 'BRANCHES';
    content.value = argvs.branches;
    dos = exes.branches;
}
// 移动到trunk分支，没有map文件
if (argvs.trunk) {
    content.name = 'TRUNK';
    content.value = argvs.trunk;
    dos = exes.trunk;
}
// 移动到指定路径 
if (argvs.$) {
    content.name = '$';
    content.value = argvs.$;
    dos = exes.branches;
}
//移动到指定路径并生成map文件
if (argvs.$$) {
    content.name = '$$';
    content.value = argvs.$$;
    dos = exes.trunk;
}
if (argvs.define) {
    dos = getWebpackExe(argvs.define);
}



/** [getWebpackExe 获取webpack命令] */
function getWebpackExe(str) {
    if (str.indexOf('webpack') == -1) return '';
    return str.split(',').join(' ');
}

/**
 * [prompt 类似confirm]
 * @param  {[type]}   prompt   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function prompt(prompt, callback) {
    process.stdout.write(color.INP + prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}

/** [resetConfigJs 备份webpack.config.json文件] */
function resetConfigJs(tpl) {
    var t = Date.now();

    if (fs.existsSync(path.join(cwd, configFileName))) {
        fs.rename(path.join(cwd, configFileName), path.join(cwd, t + '_' + configFileName));
    }

    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        fs.rename(path.join(cwd, 'package.json'), path.join(cwd, t + '_package.json'));
    }

    copy(path.join(tpl, configFileName), path.join(cwd, configFileName));
    copy(path.join(tpl, 'package.json'), path.join(cwd, 'package.json'));
    console.log(`${color.SUCCESS} 配置文件已重置！`);
}

/** [copy 复制文件到] */
function copy(from, to) {
    var readerStream = fs.createReadStream(from);
    var writerStream = fs.createWriteStream(to);
    readerStream.pipe(writerStream);
}

function isMouduleDir() {
    var webpack = path.join(process.cwd(), configFileName);
    var modules = path.join(process.cwd(), 'node_modules');
    var package = path.join(process.cwd(), 'package.json');
    return fs.existsSync(webpack) && fs.existsSync(modules) && fs.existsSync(package);
}

/** [removeWebpackConfigJs 删除webpck.config.js文件] */
function removeWebpackConfigJs() {
    if (!isMouduleDir()) {
        fs.unlink(path.join(process.cwd(), configFileName));
        fs.unlink(path.join(process.cwd(), writeFileName));
    }
}

/** [addWebpackConfigJs 添加webpck.config.js文件] */
function addWebpackConfigJs() {
    if (!isMouduleDir()) {
        fs.writeFile(writeFileName, JSON.stringify(content), function(err) {
            if (err) throw err;
        });
        copy(path.join(lib, configFileName), path.join(process.cwd(), configFileName));
    }
}

/** [exeChildProcess 执行子进程] */
function exeChildProcess() {
    if (dos == '') return false;
    const spawn = require('child_process').spawn;
    const ls = spawn(dos + ' --colors --hide-modules', { shell: true });

    ls.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.on('close', (code) => {
        // console.log(`${code}`);
    });
}

function start() {
    process.on('exit', function(chunk) {
        removeWebpackConfigJs();
    });

    process.on('SIGINT', function(chunk) {
        removeWebpackConfigJs();
        process.exit();
    });
    addWebpackConfigJs();
    exeChildProcess();
}
start();
