module.exports = class M {
  static start(op, input, success, failure) {
    try {
      op(M, input, success, failure);
    } catch (e) {
      failure(e, op, input, success);
    }
  }

  static end() {}
}
