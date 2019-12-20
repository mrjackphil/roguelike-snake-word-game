import html from '@rollup/plugin-html';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

module.exports = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm'
  },
  plugins: [
    typescript(),
    resolve(),
    html({ title: "RotJS Examplek" }),
    serve('dist'),
    livereload('dist')
  ],
};
