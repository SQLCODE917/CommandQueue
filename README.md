Decoupling

A formula:
- component calls web service
- data pipeline processes result
- same component provides callback for result


Typical, tightly coupled way:

```
class API {
  static top2k () {
    return new Promise((resolve, reject) => {
      resolve ({
        "words": [0, 1, 2]
      })
    })
  }

  static get (id) {
    const corpus = {
      0: "word0",
      1: "word1",
      2: "word2"
    }
    return corpus[id]  
  }
}

function pipeline ({ words }) {
  return new Promise ((resolve, reject) => {
    resolve (words.map(API.get))
  })
}

API.top2k()
  .then(pipeline)
  .then(console.log)
```

What is going on here?
3 separate concerns:
- network traffic
- data processing
- whatever postconditions happen

How could we unit test this without mocks?
There must be a way to break this down into pure functions:
- network traffic
  - data in, network request out
  - data = request parameters
  - logic = glue code
  - tested with integration tests
- data pipeline
  - data in, data out, pure functions, easy
- success/failure handlers
  - data in, message out
  - message into a queue, let others deal with it

One more thing - how do we arrange these functions?
- in a sequence
- this is arrangement of work, decouple it from the work

For example, let's walk - one foot in front of another:

```
function nope () {}

function seq (first, next) {
  return (input, success=nope, failure=nope) => {
    first (input, seq(next, success), failure)
  }
}

first = (input, next, failure) => { 
  console.log("First, this foot")
  next(1) 
}

second = (input, next, failure) => { 
  console.log("Then, the other foot")
  next(2)
}

errorHandler = (e) => { console.log("ERROR", e) }
successCallback = () => { console.log("GREAT SUCCESS!") }

seq(first, second)(0, successCallback, errorHandler)
```

- does `first` need to know `second`?
  - no, but then, how would we pass state between steps?
- do `first` and `second` need to share an interface?
  - yes, but it needs to be flexible enough to support any function
- callbacks?
  - doesn't have to be so, just to allow for async code


Addressing this would require one more level of indirection:

```
class Env {
  constructor(base) {
    if (base) {
      this.base = base;
      this.symbols = Object.create( base.symbols );
    } else {
      this.symbols = {};
    }
  }

  define (name, value) {
    this.symbols[`E_${name}`] = value;
  }

  resolve (name) {
    return this.symbols[`E_${name}`];
  }

  subenv (env) {
    return new Env(env);
  }
}

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

const promises = [first, second, third]
const env = new Env()
env.define('precondition', 'set')

class M {
  static start(op, input, success, failure) {
    try {
      op(M, input, success, failure);
    } catch (e) {
      failure(e, op, input, success);
    }
  }

  static end() {}
}

class AsynchronousOperations {
  static seq(first, next) {
    return function(M, input, success, failure) {
      M.start( first, input, AsynchronousOperations.seq(next, success), failure );
    }
  }

  static rseq(next, first) { return AsynchronousOperations.seq(first, next); }

  static chain(operations) {
    const reverseOps = operations.slice(0).reverse();
    return function(M, input, success, failure) {
      M.start(reverseOps.reduce(AsynchronousOperations.rseq, success),
        input,
        M.end,
        failure);
    };
  }
}

//command like (env) => env
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

function run(promises, env) {
  M.start(AsynchronousOperations.chain(promises),
    env,
    (M, successChanges, success, failure) => {
      console.log("SUCCESS!!!!!!!!")
    },
    (error, asop, env, success) => {
      console.log("ERROR!!!!!!")
    }
  )
}

run(promises.map(asopify), env)
```

And this is not dissimilar from a command queue.
How could enterprise architectures benefit from being written as a job scheduler?
Is there a piece of business logic that cannot be decoupled with a commands and queues?

But wait, why mix callbacks and promises, why not just

```
function chain (promises) {
  return promises.reduce((now, next) => now.then(next),
    Promise.resolve()
  )
}

chain(promises)
```

This needs to be reflected upon

TODO: can I rewrite AsynchronousOperations and M as a single `.reduce`?
