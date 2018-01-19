module.exports = class Env {
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
