#!/usr/bin/env node

// 修改前（错误：试图拿一个不存在的 default 导出）
// import main from "../out/main.js";
// main();

// 修改后（正确：直接 import 整个模块，触发顶层副作用）
import "../out/main.js";
