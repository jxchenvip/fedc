var color = {
    _BLACK: '\033[0;30m',
    _RED: '\033[0;31m',
    _GREEN: '\033[0;32m',
    _YELLOW: '\033[0;33m',
    _BLUE: '\033[0;34m',
    _PURPLE: '\033[0;35m',
    _CYAN: '\033[0;36m',
    _WHITE: '\033[0;37m',
    _RE: '\033[0m',
    black: function (s) {
        return this.render(this._BLACK, s);
    },
    red: function (s) {
        return this.render(this._RED, s);
    },
    green: function (s) {
        return this.render(this._GREEN, s);
    },
    yellow: function (s) {
        return this.render(this._YELLOW, s);
    },
    blue: function (s) {
        return this.render(this._BLUE, s);
    },
    purple: function (s) {
        return this.render(this._PURPLE, s);
    },
    cyan: function (s) {
        return this.render(this._CYAN, s);
    },
    white: function (s) {
        return this.render(this._WHITE, s);
    },
    render: function (color, s) {
        return color + s + this._RE;
    },
    init: function () {
        this.SUCCESS = this.green('[SUCCESS] ');
        this.FLOW = this.purple('[FLOW] ');
        this.ERROR = this.red('[ERROR] ');
        this.INP = this.yellow('[INP] ');
        this.TIP = this.cyan('[TIP] ');
    }
};
color.init();
module.exports = color; 