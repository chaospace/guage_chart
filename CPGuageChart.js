const RADIAN_UNIT = Math.PI / 180;
const BASE_RADIAN = Math.PI;
const DURATION = 50;
const SIZE = {
  W: 300,
  H: 150
};
const COLORS = ["lightSkyBlue", "green", "yellow", "orange", "red"];
class GuageChart {
  constructor(container, opt = {}) {
    this.aniamteID = -1;
    this.scaleRatio = 1;

    let option = Object.assign(
      {
        w: 300,
        h: 150,
        startAngle: 0,
        endAngle: 180,
        min: 0,
        max: 100,
        value: 0,
        lineWidth: 24,
        guageBGColor: "#f1f3f5",
        guageColor: "#ff7133",
        tickStep: 45,
        tickColor: "#d8d8d8",
        thumbImg: "./assets/guage/icon-sunrise.png",
        sunsetImg: "./assets/guage/icon-sunset.png"
      },
      opt
    );
    this._initialize = false;
    this._value = 0;
    this._min = option.min;
    this._max = option.max;
    this.colors = option.colors;
    this.resizeHandler = this.resize.bind(this);
    this.initCanvas(container);
    this.setRange(option.startAngle, option.endAngle);
    this.setLineWidth(option.lineWidth);
    this.setGuageBGColor(option.guageBGColor);
    this.setGuageColor(option.guageColor);
    this.setTickColor(option.tickColor);
    this.setTickStep(option.tickStep);

    this.loadImage(option.thumbImg, this.setThumb);
    this.loadImage(option.sunsetImg, this.setSunSetImage);
    window.addEventListener("resize", this.resizeHandler);
    this.resize();
  }

  initCanvas(view) {
    this.container = view;
    const tagName = view.firstElementChild.tagName.toLocaleLowerCase();
    this.canvas =
      tagName !== "canvas"
        ? document.createElement("canvas")
        : view.firstElementChild;
    if (!this.container.contains(this.canvas)) {
      this.container.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext("2d");
  }

  setSize(w = 300, h = 150) {
    this.w = w;
    this.h = h;
    this.updateContextScale();
    this.setCenter(this.w / 2, this.h - this.lineWidth);
    this.render(1);
  }

  setCenter(cx, cy) {
    this.cx = cx;
    this.cy = cy;
  }

  setLineWidth(lineWidth = 16) {
    this.lineWidth = lineWidth;
  }

  setGuageBGColor(color = "#d8d8d8") {
    this.guageBGColor = color;
  }

  setGuageColor(color = "#ff7133") {
    this.guageColor = color;
  }

  setTickColor(color = "#E9ECEF") {
    this.tickColor = color;
  }

  setTickStep(step = 45) {
    this.tickStep = step;
  }

  setRange(start = 0, end = 180) {
    this.startAngle = BASE_RADIAN + start * RADIAN_UNIT;
    this.endAngle = BASE_RADIAN + end * RADIAN_UNIT;
  }

  setThumb(thumbImage) {
    this.thumb = thumbImage;
    this.checkInitialize();
  }

  setSunSetImage(sunsetImage) {
    this.sunset = sunsetImage;
    this.checkInitialize();
  }

  setLabels(labels) {
    this.labels = labels;
  }

  initGradient() {
    const range = this.min + (this.max - this.min);
  }

  checkInitialize() {
    if (!this._initialize && this.thumb && this.sunset) {
      this._initialize = true;
      this.initGradient();
      this.render();
    }
  }

  /**
   * 차트 눈금 그리기
   */
  drawStep() {
    let r = this.radius - this.lineWidth;
    let stepUnit = this.tickStep * RADIAN_UNIT;
    let thick = this.lineWidth * 0.5;
    let angle = stepUnit;
    while (angle <= this.endAngle) {
      this.ctx.save();
      const { x, y } = this.getPositionByAngle(angle, r);
      this.ctx.beginPath();
      this.ctx.fillStyle = this.tickColor;
      //회전 변환
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);
      this.ctx.translate(-x, -y);
      this.ctx.fillRect(x, y, thick, 1);
      this.ctx.fill();
      //회전 변환 끝
      this.ctx.closePath();
      angle += stepUnit;
      this.ctx.restore();
    }
  }

  get radius() {
    return Math.min(this.cx, this.cy) - this.lineWidth;
  }

  set min(nValue) {
    this._min = nValue;
  }

  get min() {
    return this._min;
  }

  set max(nValue) {
    this._max = nValue;
  }

  get max() {
    return this._max;
  }

  set values(values) {
    this._values = values;
  }
  get values() {
    return this._values;
  }

  set value(value) {
    if (this._value != value) {
      this._value = value;
      this.start();
    }
  }

  get value() {
    return this._value;
  }

  updateContextScale() {
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio =
      this.ctx.webkitBackingStorePixelRatio ||
      this.ctx.mozBackingStorePixelRatio ||
      this.ctx.msBackingStorePixelRatio ||
      this.ctx.oBackingStorePixelRatio ||
      this.ctx.backingStorePixelRatio ||
      1;
    let ratio = devicePixelRatio / backingStoreRatio;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    // attribute에 ratio 값을 곱한 width, height 지정
    this.canvas.width = `${this.w * ratio}`;
    this.canvas.height = `${this.h * ratio}`;
    this.ctx.scale(ratio, ratio);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  drawArc(lineWidth, color, rate) {
    let min = this.startAngle;
    let max = this.endAngle;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.cx, this.cy, this.radius, min, min + (max - min) * rate);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawGradient(lineWidth, rate) {
    let min = this.startAngle;
    let max = this.endAngle;
    this.ctx.save();

    for (let i = 0; i < this.colors.length; i++) {
      this.ctx.beginPath();
      const vo = this.colors[i];
      let startColor = vo.scolor;
      let endColor = vo.ecolor;
      let startAngle = BASE_RADIAN + vo.sAngle * RADIAN_UNIT;
      let endAngle = BASE_RADIAN + vo.eAngle * RADIAN_UNIT;
      let grad = this.ctx.createLinearGradient(
        this.cx + Math.cos(startAngle) * this.radius,
        this.cy + Math.sin(startAngle) * this.radius,
        this.cx + Math.cos(endAngle) * this.radius,
        this.cy + Math.sin(endAngle) * this.radius
      );

      grad.addColorStop(0, startColor);
      grad.addColorStop(1, endColor);
      this.ctx.strokeStyle = grad;
      this.ctx.arc(this.cx, this.cy, this.radius, startAngle, endAngle);
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
      this.ctx.closePath();
    }
    //this.ctx.restore();
    this.ctx.globalCompositeOperation = "destination-in";
    this.ctx.beginPath();
    this.ctx.arc(this.cx, this.cy, this.radius, min, min + (max - min) * rate);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = this.guageColor;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  getPositionByAngle(t, r) {
    const x = this.cx + Math.cos(BASE_RADIAN - t) * r;
    const y = this.cy - Math.sin(BASE_RADIAN - t) * r;
    return { x, y };
  }

  drawImageByProgress(target, t) {
    const { x, y } = this.getPositionByAngle(Math.PI * t, this.radius);
    const size = 24;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.shadowColor = "rgba(0, 0, 0, .2)";
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetX = 5;
    this.ctx.shadowOffsetY = 5;
    this.ctx.drawImage(target, x - size / 2, y - size / 2, size, size);
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawLabels(progress = 0) {
    const y = this.cy - 20;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = "#495057";
    this.ctx.font = "700 40px SpoqaHanSans-Regular";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`${Math.floor(this.value * progress)}`, this.cx, y);
    this.ctx.font = "16px SpoqaHanSans-Regular";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`kWh`, this.cx, y);
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#868e96";
    this.ctx.fillText(`4월 1일 (목)`, this.cx, this.cy);
    this.ctx.closePath();
    this.ctx.restore();
  }

  loadImage(url, callback) {
    const img = document.createElement("img");
    img.onload = () => {
      callback.call(this, img);
    };
    img.src = url;
  }

  stop() {
    if (this.aniamteID > -1) {
      cancelAnimationFrame(this.aniamteID);
      this.aniamteID = -1;
    }
  }

  easeOutQuad(t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  }

  // 크기 변경에 따른 처리 적용
  resize() {
    const areaSize = this.container.getBoundingClientRect();
    const ratio = areaSize.width / SIZE.W;
    this.scaleRatio = ratio;
    this.setSize(SIZE.W * ratio, SIZE.H * ratio);
  }

  start() {
    this.stop();
    let timer = 0;
    let animateID;
    const animate = () => {
      timer += 1;
      const progress = this.easeOutQuad(timer, 0, 1, DURATION);
      this.render(progress);
      if (progress == 1) {
        cancelAnimationFrame(animateID);
      } else {
        animateID = requestAnimationFrame(animate);
      }
    };
    animateID = requestAnimationFrame(animate);
  }

  render(progress = 0) {
    const range = this.min + (this.max - this.min);
    const t = ((this.value - this.min) / range) * progress;
    this.clear();
    this.drawArc(this.lineWidth, this.guageBGColor, 1);
    //this.drawArc(this.lineWidth, this.guageColor, t);
    this.drawGradient(this.lineWidth, t);
    this.drawStep();
    if (this.thumb) {
      this.drawImageByProgress(this.thumb, t);
    }
    if (this.sunset) {
      this.drawImageByProgress(this.sunset, 1);
    }
    this.drawLabels(progress);
  }
}
