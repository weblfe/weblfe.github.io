const fs = require("fs");
const images = require("images");
const process = require("process");
const { program, option } = require("commander");
const { dirname, join } = require("path");

const workdir = join(
  dirname(__dirname),
  "themes/hexo-theme-matery/source/medias"
);

program
  .name("images")
  .description("图片压缩")
  .option("-p, --path <path>", "选中需要压缩的文件夹", "")
  .option("-f, --file <file>", "选中单个要压缩的图片", "")
  .option("-e, --excludes <file>", "要排除的图片", "")
  .helpOption("-h, --help", "压缩blog图片资源", false);

// 是否图片
const isImages = (filename) => {
  if (!/(\.jpg|\.jpeg|\.png|\.gif)$/i.test(filename)) {
    return false;
  }
  return true;
};

// 压缩
const explorer = (path, options) => {
  let state = fs.statSync(path);
  if (state.isFile()) {
    if (!isImages(path)) {
      console.error("不支持图片文件类型!");
      return;
    }
    console.log("压缩-文件名:" + path);
    images(path).save(path, {
      quality: 60, //保存图片到文件,图片质量为50
    });
    return;
  }
  fs.readdir(path, function (err, files) {
    //err 为错误 , files 文件名列表包含文件夹与文件
    if (err) {
      console.log("error:\n" + err);
      return;
    }
    files.forEach(function (file) {
      fs.stat(path + "/" + file, function (err, stat) {
        if (err) {
          console.log(err);
          return;
        }
        if (stat.isDirectory()) {
          // 如果是文件夹遍历
          explorer(path + "/" + file);
          return;
        }
        // 读出所有的文件
        if (!isImages(file)) {
          return;
        }
        if (isExcludes(file, options)) {
          return;
        }
        console.log("压缩-文件名:" + path + "/" + file);
        let name = path + "/" + file;
        let outName = path + "/" + file;
        //Save the image to a file, quality 50
        images(name).save(outName, {
          quality: 60, //保存图片到文件,图片质量为50
        });
      });
    });
  });
};

// 排除
const isExcludes = (filename, options) => {
  if (filename == "" || filename == undefined) {
    return true;
  }
  if (options instanceof undefined) {
    return false;
  }
  if (typeof options != "object") {
    return false;
  }
  if (options.excludes instanceof undefined) {
    return false;
  }
  if (options.excludes instanceof Array) {
    for (let i in options.excludes) {
      let value = options.excludes[i];
      if (value instanceof RegExp) {
        if (value.test(filename)) {
          return true;
        }
        continue;
      }
      if (typeof value == "string") {
        if (value == filename || filename.includes(value)) {
          return true;
        }
        continue;
      }
    }
  }
  return false;
};

const main = () => {
  let filename = "";
  let options = {};
  let dir = program.path || "";
  let file = program.file || "";
  let excludes = program.excludes || undefined;
  if (dir == "" && file == "") {
    dir = workdir;
  }
  if (dir != "") {
    filename = dir;
  }
  if (filename == "" && file != "") {
    filename = file;
  }
  if (excludes != undefined) {
    if (excludes.includes(",")) {
      excludes = excludes.split(",");
    }
    options.excludes = excludes;
  }
  return { filename, options };
};

program.on("option:verbose", function () {
  process.env.VERBOSE = this.verbose;
});

program.on("option:help", function () {
  program.helpInformation();
  process.exit(0);
});

program.parse(process.argv);

const { filename, options } = main();

explorer(filename, options);
