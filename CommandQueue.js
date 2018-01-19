const M = require ('./util/M.js')
const ASOP = require('./util/AsynchronousOperations.js')

module.exports = class CommandQueue {
  constructor (_commands) {
    this.commands = [];
    if (_commands) {
      _commands.forEach(this.enqueue.bind(this))
    }
  }

  enqueue (command) {
    this.commands.push(asopify(command))
  }

  run (env) {
    return new Promise((resolve, reject) => {
      M.start(ASOP.chain(this.commands),
        env,
        (M, env, success, failure) => {
          resolve(env)
        },
        reject
      )
    })
  }  
}

function asopify(fn) {
  return (M, env, success, failure) => {
    fn(env).then((env) => {
      const newEnv = env.subenv(env)
      M.start(success, newEnv, M.end, failure)
    }).catch((reason) => {
      M.start(failure, reason, env, success)
    })
  }
}

