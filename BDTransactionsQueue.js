class BDTransactionsQueue {
  constructor() {
    this.transactionsQueue = []
    this.loopRunning = false
  }
  _transactionsLoop() {
    if(!this.loopRunning)
      this.loopRunning = true

    this.transactionsQueue.shift()()
      .then(() => {
        if(this.transactionsQueue.length === 0) {
          this.loopRunning = false
          return
        }

        this._transactionsLoop()
      })
  }
  addTransaction(transaction) {
    this.transactionsQueue.push(transaction)

    if(!this.loopRunning)
      this._transactionsLoop()
  }
}

const TransactionsQueue = new BDTransactionsQueue()
module.exports = TransactionsQueue