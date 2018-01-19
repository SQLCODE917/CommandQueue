const M = require('./M.js');

module.exports = class AsynchronousOperations {
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
