const { src, dest } = require('gulp');
const path = require('path');

function buildIcons() {
  return src(['nodes/**/*.{png,svg}', 'credentials/**/*.{png,svg}'])
    .pipe(dest((file) => {
      return path.join('dist', path.relative('.', file.base));
    }));
}

buildIcons.description = 'Build icons';

module.exports = {
  'build:icons': buildIcons,
};
