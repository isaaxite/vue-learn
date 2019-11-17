/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // Convert HTML string to AST.
  const ast = parse(template.trim(), options)
  // const tempAst = parse(`<span>{{ info.name }}</span>`, options);
  // l('tempAst: ', tempAst);
  if (options.optimize !== false) {
    console.log('optimize');
    optimize(ast, options)
  }
  l('ast', ast);
  const code = generate(ast, options)
  l('createCompiler return: ',{
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  })
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
