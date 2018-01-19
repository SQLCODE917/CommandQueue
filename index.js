const Env = require('./util/Env.js')
const CommandQueue = require('./CommandQueue.js')

const commands = [first, second, third]

const env = new Env()
env.define('precondition', 'set')

new CommandQueue(commands).run(env)

async function first(env) {
  console.log("First")
  console.log(env.resolve('precondition'))
  env.define("First", "1st")
  return env
}

async function second(env) {
  console.log("Second")
  console.log(env.resolve('precondition'))
  console.log(env.resolve('First'))
  env.define("Second", "2nd")
  return env
}

async function third(env) {
  console.log("Third")
  console.log(env.resolve('precondition'))
  console.log(env.resolve('First'))
  console.log(env.resolve('Second'))
  env.define("Third", "3rd")
  return env
}

