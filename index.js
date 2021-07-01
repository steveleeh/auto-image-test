const fs = require('fs')
const config = require('./config.json')
const Handlebars = require("handlebars");
const fsExtra = require('fs-extra');

/**
 * 删除文件夹下所有问价及将文件夹下所有文件清空
 * @param {*} path
 */
function emptyDir(path) {
  const files = fs.readdirSync(path);
  files.forEach(file => {
    const filePath = `${path}/${file}`;
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      emptyDir(filePath);
    } else {
      fs.unlinkSync(filePath);
      console.log(`删除${file}文件成功`);
    }
  });
}

/**
 * 读取目录
 * @param path 地址
 */
function readDir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, function (error, data) {
      if (error) {
        reject(error)
        return;
      }
      resolve(data)
    });
  })
}

Handlebars.registerHelper('if_eq', function (a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

const templateContent = fs.readFileSync(`${__dirname}\\template.hbs`).toString();
const template = Handlebars.compile(templateContent);

async function getImageNameList(dir, length) {
  const dirList = await readDir(dir)

  const imageNames = []
  for (let i = 0; i < length; i++) {
    imageNames[i] = dirList[i % dirList.length]
  }
  return imageNames
}


async function generateTemplate() {
  for (const item of config.data) {
    const length = item.col * item.row;
    const dir = `${__dirname}\\image\\${item.suffix}`;
    const imageNames = await getImageNameList(dir, length)
    const data = [];
    for (let i = 0; i < length; i = i + 1) {
      data.push({...item, url: `../image/${item.suffix}/${imageNames[i]}`})
    }
    const templateParams = {list: data}
    const templateContent = template(templateParams)
    fs.writeFile(
        `${__dirname}\\dist\\${item.row}x${item.col}-${item.suffix}.html`,
        templateContent,
        {encoding: 'utf8', flag: 'w'},
        (err) => {
          if (err) {
            console.error('生成文件失败', err);
          }
        },
    )
  }
}

async function run() {
  // 清空文件夹
  fsExtra.emptyDirSync(`${__dirname}\\dist`);
  await generateTemplate()
}

run()

// console.log('dirurl', __dirname)

// console.log(template({list: [{row: 1, col: 1, url: './dist.png', type: 2}]}));
