
import {
  CellRenderer, TextRenderer
} from '@phosphor/datagrid';

import {
  GraphicsContext
} from '@phosphor/datagrid';


/**
 * A cell renderer which renders an HTML image element.
 */
export
class TextIconRenderer extends TextRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: TextIconRenderer.IOptions = {}) {
    super(options);
    this.icon = options.icon || null;
  }

  /**
   * Icon to render.
   */
  readonly icon: CellRenderer.ConfigOption<HTMLImageElement | null>;

  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  /*paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    super.paint(gc, config);
    this.drawIcon(gc, config);
  }*/

  /**
   * Draw the text and icon for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Resolve the font for the cell.
    let font = CellRenderer.resolveOption(this.font, config);

    // Bail if there is no font to draw.
    if (!font) {
      return;
    }

    // Resolve the text color for the cell.
    let color = CellRenderer.resolveOption(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!color) {
      return;
    }

    // Resolve the vertical and horizontal alignment.
    let vAlign = CellRenderer.resolveOption(this.verticalAlignment, config);
    let hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - (vAlign === 'center' ? 1 : 2);

    // Bail if the text box has no effective size.
    if (boxHeight <= 0) {
      return;
    }

    // Compute the text height for the gc font.
    let textHeight = TextRenderer.measureFontHeight(font);

    // Set up the text position variables.
    let textX: number;
    let textY: number;
    let boxWidth: number;
    let iconX: number = 0;
    let iconY: number = 0;
    let iconHeight: number = 0;


    // Resolve the background color for the cell.
    let icon = CellRenderer.resolveOption(this.icon, config);

    if (icon) {
      iconX = config.x + 4; //config.width - (icon.width + 6);
      iconHeight = icon.height;
    }

    // Compute the Y position for the text and icon.
    switch (vAlign) {
    case 'top':
      iconY = config.y + 2;
      textY = config.y + 2 + textHeight;
      break;
    case 'center':
      iconY = config.y + config.height / 2 - iconHeight / 2;
      textY = config.y + config.height / 2 + textHeight / 2;
      break;
    case 'bottom':
      iconY = config.y + config.height - 2 - iconHeight;
      textY = config.y + config.height - 2;
      break;
    default:
      throw 'unreachable';
    }

    // Compute the X position for the text and icon
    switch (hAlign) {
    case 'left':
      textX = config.x + 8;
      boxWidth = config.width - 14;
      break;
    case 'center':
      textX = config.x + config.width / 2;
      boxWidth = config.width - 14;
      break;
    case 'right':
      textX = config.x + config.width - 8;
      boxWidth = config.width - 14;
      iconX = config.x + 4;
      break;
    default:
      throw 'unreachable';
    }

    // Draw the icon if available
    if (icon) {
      let iconWidth = icon.width + 4;
      boxWidth -= (hAlign !== "center") ? iconWidth : 2 * iconWidth;
      // Draw the icon for the cell.
      gc.drawImage(icon, iconX, iconY);
    }

    // Format the cell value to text.
    let format = this.format;
    let text = format(config);

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }
    // Clip the cell if the text is taller than the text box height.
    if (textHeight > boxHeight) {
      gc.beginPath();
      gc.rect(config.x, config.y, config.width, config.height - 1);
      gc.clip();
    }

    // Elide text that is too long
    let elide = '\u2026';
    let textWidth = gc.measureText(text).width;

    // Compute elided text
    while ((textWidth > boxWidth) && (text.length > 1)) {
      if (text.length > 4 && textWidth >= 2 * boxWidth) {
        // If text width is substantially bigger, take half the string
        text = text.substring(0, (text.length / 2) + 1) + elide;
      } else {
        // Otherwise incrementally remove the last character
        text = text.substring(0, text.length - 2) + elide;
      }
      textWidth = gc.measureText(text).width;
    }

    // Set the gc state.
    gc.font = font;
    gc.fillStyle = color;
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';

    // Draw the text for the cell.
    gc.fillText(text, textX, textY);
  }
}

/**
 * The namespace for the `TextIconRenderer` class statics.
 */
export
namespace TextIconRenderer {
  /**
   * An options object for initializing an axis renderer.
   */
  export
  interface IOptions extends TextRenderer.IOptions {
    /**
     * The icon to render.
     *
     * The default is `'null'`.
     */
    icon?: CellRenderer.ConfigOption<HTMLImageElement | null>;
  }
}



/**
 * A cell renderer which renders a vertical or horizontal axis.
 */
export
class AxisRenderer extends TextRenderer {
  /**
   * Construct a new axis renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: AxisRenderer.IOptions = {}) {
    super(options);
    this.direction = options.direction || 'x';
    this.edge = options.edge || 'footer';
    this.strict = options.strict || true; //false;
    this.tickText = options.tickText || AxisRenderer.niceTickText;
    this.transform = options.transform || transformLinear({direction: this.direction, strict: this.strict});
  }

  /**
   * Whether to buffer the edges.
   */
  readonly strict: boolean;

  /**
   * The direction of the axis
   */
  readonly direction: AxisDirection; 

  /**
   * Which side of the grid
   */
  readonly edge: AxisRenderer.GridEdge;

  /**
   * The transform function for the cell value.
   */
  readonly transform: TransformFunc;

  /**
   * The transform function for the tick text value.
   */
  readonly tickText: AxisRenderer.TickRenderFunc;

  /**
   * Prepare the graphics context for drawing a column of cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param config - - The configuration data for the cell.
   *
   **/
  /*prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void {
    let metadata = config.metadata;

    // Calculate nice ticks for this range
    let ticks = Private.generateTicks(metadata.min, metadata.max, 2, this.strict);
    metadata.min = ticks[0];
    metadata.max = ticks[ticks.length - 1];

    this._ticks = ticks;
  }*/

  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Draw the axis

    let transform = this.transform;

    // Resolve the font for the cell.
    let font = CellRenderer.resolveOption(this.font, config);

    // Bail if there is no font to draw.
    if (!font) {
      return;
    }

    // Resolve the text color for the cell.
    let color = CellRenderer.resolveOption(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!color) {
      return;
    }

    // Calculate position of zero tick
    let ticks = this._ticks;
    let positions = ticks.map( (tick) => {
      return transform({
      ...config, value: tick
      });
    });

    let {x, y, width, height} = config;

    // Set up the text position variables.
    let textX: number;
    let textY: number;
    let val: string;

    let padding = 3;

    // Set the gc state.
    gc.font = font;
    gc.fillStyle = color;

    let textHeight = TextRenderer.measureFontHeight(font);

    let tickText = this.tickText;

    if (this.direction === 'x') {
      if (this.edge === 'footer') {
        textY = y + padding;
        gc.textBaseline = 'top';
      } else {
        textY = y + height - padding;
        gc.textBaseline = 'bottom';
      }

      gc.textAlign = 'center';

      let tickCount = ticks.length;
      val = tickText(ticks[0]);
      let textWidget = gc.measureText(val).width;
      if (width < textWidget) {
        tickCount = 1;
      }

      for (let t = 0; t < tickCount; t++) {
        textX = x + positions[t];
        val = tickText(ticks[t]);
        let textWidth = gc.measureText(val).width / 2;
        if (textX === x) {
          textX = x + textWidth + 1;
        }
        if (textX + textWidth > x + width) {
          textX = x + width - textWidth - 3;
        }
        gc.fillText(val, textX, textY);
      }
    } else {
      if (this.edge === 'footer') {
        textX = x + padding;
        gc.textAlign = 'left';
      } else {
        textX = x + width - padding;
        gc.textAlign = 'right';
      }

      gc.textBaseline = 'middle';
      let halfHeight = textHeight / 2;

      let tickCount = ticks.length;
      if (height < textHeight * 2) {
        tickCount = 1;
      }

      // Draw the text for the cell.
      for (let t = 0; t < tickCount; t++) {
        textY = y + height - positions[t];
        val = tickText(ticks[t]);
        if (textY === y) {
          textY = y + halfHeight;
        }
        if (textY + halfHeight > y + height) {
          textY = y + height - halfHeight - 1;
        }

        gc.fillText(val, textX, textY);
      }
    }

    let cutoffHeight = textHeight * 2.2

    // Draw the axis label
    if (this.direction === 'y' && width > cutoffHeight) {
      // Rotate
      if (this.edge === 'footer') {
        gc.translate( x, y + height);
        gc.rotate(3 * Math.PI / 2);
      } else {
        gc.translate( x + width, y);
        gc.rotate(Math.PI / 2);      
      }
      
      // Need to flip the dimensions because of the rotation
      this.drawText(gc, {
        ...config, x: 0, y: 0, width: height, height: width
      });

      gc.setTransform(1, 0, 0, 1, 0, 0);
    } else if (height > cutoffHeight) {
      this.drawText(gc, config);
    }
  }

  /**
   * The tick locations for the cell value.
   */
  private _ticks: number[];
}

/**
 * The namespace for the `AxisRenderer` class statics.
 */
export
namespace AxisRenderer {
  /**
   * An options object for initializing an axis renderer.
   */
  export
  interface IOptions extends TextRenderer.IOptions {
    /**
     * The strictness of buffering the axis ends.
     *
     * The default is `'false'`.
     */
    strict?: boolean;

    /**
     * The axis direction of the renderer.
     *
     * The default is `'x'`.
     */
    direction?: AxisDirection;

    /**
     * The side of the grid that the axis is on
     *
     * The default is `'footer'`.
     */
    edge?: AxisRenderer.GridEdge;

    /**
     * The transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transform?: TransformFunc;

    /**
     * The function to generate tick text for the renderer.
     *
     * The default is `transformLinear()`.
     */
    tickText?: TickRenderFunc;

  }

  /**
   * A type alias for the side of the grid the axis is located
   */
  export
  type GridEdge = 'header' | 'footer';

  /**
   * A type alias for a tick renderer function.
   *
   * This type is used to compute the axis text for a tick value.
   */
  export
  type TickRenderFunc = (tick: number) => string;

  let prefixes = ['', 'K', 'M', 'B', 'T'];
  let operands = [0, 1e3, 1e6, 1e9, 1e12];

  export
  function niceTickText(val: number) : string {
    let power = Math.trunc(Math.floor(Math.log10(Math.abs(val))) / 3);
    if (power > 0) {
      let prefix: string = prefixes[power];
      let operand: number = operands[power];
      let label = `${Math.trunc(val/operand)}${prefix}`;
      return label;
    } else {
      return val.toString();
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-us');

  export
  function niceDateText(val: number) : string {
    return dateFormatter.format(new Date(val));
  }

}

/**
 * A cell renderer which renders data values as bars.
 */
export
class BarRenderer extends CellRenderer {
  /**
   * Construct a new bar renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: BarRenderer.IOptions = {}) {
    super();
    this.barColor = options.barColor || '#407aaa';
    this.transform = options.transform || transformLinear();
  }

  /**
   * The CSS color for drawing the bar.
   */
  readonly barColor: CellRenderer.ConfigOption<string>;

  /**
   * The transform function for the cell value.
   */
  readonly transform: TransformFunc;

  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {

    // Transform the cell value to width.
    let transform = this.transform;

    let ticks = this._ticks;

    let xpos = ticks.map( (tick) => {
      return transform({
      ...config, value: tick,
      });
    });

    //let refColor = CellRenderer.resolveOption(this.refColor, config);
    gc.setLineDash([2,2]);
    gc.strokeStyle = '#E2E2E2'; //refColor;
    gc.beginPath();
      for (let x_i = 0; x_i < xpos.length; x_i++) {
        let x = config.x + xpos[x_i]
        gc.moveTo(x, config.y);
        gc.lineTo(x, config.y + config.height);
      }
    gc.stroke();

    // Bail if there is no value
    if (config.value == null) {
      return;
    }

    // Resolve the background color for the cell.
    let color = CellRenderer.resolveOption(this.barColor, config);

    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    gc.fillStyle = color;
//    gc.strokeStyle = null;

    // XXX Need a better way of determining whether its partitioned
    // Perhaps the metadata
    let sizes: any[];
    if (Array.isArray(config.value)) {
      sizes = config.value;
    } else {
      sizes = [config.value];
    }

    let widths = sizes.map( (size: number) => {
      return transform({
      ...config, value: size
      });
    });

    //let val = transform(config);

    let zp = transform({
      ...config, value: 0,
    });

    let x = config.x;
    let height = (config.height * 0.65);
    let y = config.y + (config.height - height) / 2;
    let anchored_at_zero = (config.metadata.min === 0);
    let width: number;

    let colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
                  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];

    for (let i = 0; i < widths.length; i++) {
      let val = widths[i];
      let color = colors[i];

      if (anchored_at_zero) {
        width = val;
      } else {
        x = config.x + val;
        width = zp - val;
      }

      if (width === 0) {
        continue;
      }

      gc.fillStyle = color;
      gc.fillRect(x, y, width, height);

      x = x + val; // + 1;
     }
  }

  /**
   * Prepare the graphics context for drawing a column of cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param config - - The configuration data for the cell.
   *
   **/
  /*prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void {
    let metadata = config.metadata;

    // Calculate nice ticks for this range
    let ticks = Private.generateTicks(metadata.min, metadata.max, 2);
    metadata.min = ticks[0];
    metadata.max = ticks[ticks.length - 1];

    this._ticks = ticks;

    // Calculate zero point
    if (metadata.min > 0) {
      // Bars needed to be rendered from 0
      metadata.min = 0;
    }
  }*/

  /**
   * The tick locations for the cell value.
   */
  private _ticks: number[] = [];

}

/**
 * The namespace for the `BarRenderer` class statics.
 */
export
namespace BarRenderer {
  /**
   * An options object for initializing a bar renderer.
   */
  export
  interface IOptions {
    /**
     * The bar color for the cells.
     *
     * The default is `''`.
     */
    barColor?: CellRenderer.ConfigOption<string>;

    /**
     * The transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transform?: TransformFunc;
  }
}


/**
 * A cell renderer which renders 2/3/4 dimension arrays as scatters
 */
export
class ScatterRenderer extends CellRenderer {
  /**
   * Construct a new scatter renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: ScatterRenderer.IOptions = {}) {
    super();
    this.pointColor = options.pointColor || '#407AAA';
    this.radius = options.radius || 5;
    this.maxRadius = options.maxRadius || 16;
    this.transformX = options.transformX || transformLinear({direction: 'x'});
    this.transformY = options.transformY || transformLinear({direction: 'y'});
    this.transformSize = options.transformSize || transformLinear({strict: true});
    this.refColor = options.refColor || '#E2E2E2';
  }

  /**
   * The CSS color for drawing the points.
   */
  readonly pointColor: CellRenderer.ConfigOption<string>;

  /**
   * The radius for drawing the points.
   */
  readonly radius: CellRenderer.ConfigOption<number>;

  /**
   * The maximum radius for drawing the points.
   */
  readonly maxRadius: CellRenderer.ConfigOption<number>;

  /**
   * The x axis transform function for the scatter points.
   */
  readonly transformX: TransformFunc;

  /**
   * The y axis transform function for the scatter points.
   */
  readonly transformY: TransformFunc;

  /**
   * The size transform function for the scatter points.
   */
  readonly transformSize: TransformFunc;

  /**
   * The CSS color for drawing the reference lines.
   */
  readonly refColor: CellRenderer.ConfigOption<string>;


  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {

    // Cache the computed positions of the axis lines
    let transformX = this.transformX;
    let transformY = this.transformY;
    let transformSize = this.transformSize;

    let [xmin, ymin, smin] = config.metadata.min;
    let [xmax, ymax, smax] = config.metadata.max;

    let xticks = this._xticks;
    let yticks = this._yticks;

    let xpos = xticks.map( (tick) => {
      return transformX({
      ...config, value: tick, metadata: {...config.metadata, min: xmin, max: xmax}
      });
    });

    let ypos = yticks.map( (tick) => {
      return transformY({
      ...config, value: tick, metadata: {...config.metadata, min: ymin, max: ymax}
      });
    });

    let refColor = CellRenderer.resolveOption(this.refColor, config);
    gc.setLineDash([2,2]);
    gc.strokeStyle = refColor;
    gc.beginPath();
      for (let x_i = 0; x_i < xpos.length; x_i++) {
        let x = config.x + xpos[x_i]
        gc.moveTo(x, config.y);
        gc.lineTo(x, config.y + config.height);
      }
      for (let y_i = 0; y_i < ypos.length; y_i++) {
        let y = config.y + config.height - ypos[y_i];
        gc.moveTo(config.x, y);
        gc.lineTo(config.x + config.width, y);
      }
    gc.stroke();

    // Resolve the background color for the cell.
    let color = CellRenderer.resolveOption(this.pointColor, config);

    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    let radius = CellRenderer.resolveOption(this.radius, config);
    let maxRadius = CellRenderer.resolveOption(this.maxRadius, config);
    
    gc.setLineDash([]);
    gc.lineWidth = 2;
    gc.strokeStyle = color;
    gc.fillStyle = color;

    let points = config.value;

    // Clipping is slow, need a faster method
    gc.save();
    gc.rect(config.x, config.y, config.width, config.height);
    gc.clip();

    for (let i = 0; i < points.length; i++) {
      let [xval, yval, size] = points[i];

      // Bail if the x or y value is null
      if (xval == null || yval == null) {
        continue;
      }

      // Transform the data value to x and y values.
      let x = transformX({
        ...config, value: xval, metadata: {...config.metadata, min: xmin, max: xmax}});
      let y = transformY({
        ...config, value: yval, metadata: {...config.metadata, min: ymin, max: ymax}});

      if (size) {
        radius = 0.5 + transformSize({
          ...config, value: Math.sqrt(size), width: maxRadius,
          metadata: {...config.metadata, min: smin, max: smax}});
      }
  
      // Set up the path
      gc.beginPath();

      // Add the point to the path
      gc.arc(config.x + x, config.y + config.height - y, radius, 0, 2 * Math.PI);

      gc.closePath()
      //gc.fill()

      // Now render the point
      gc.stroke();

    }
    gc.restore();
  }

  /**
   * Prepare the graphics context for drawing a column of cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param config - - The configuration data for the cell.
   *
   **/
  /*prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void {
    let metadata = config.metadata;

    // Calculate nice ticks for this range
    let xticks = Private.generateTicks(metadata.min[0], metadata.max[0], 2);
    metadata.min[0] = xticks[0];
    metadata.max[0] = xticks[xticks.length - 1];

    let yticks = Private.generateTicks(metadata.min[1], metadata.max[1], 2);
    metadata.min[1] = yticks[0];
    metadata.max[1] = yticks[yticks.length - 1];

    // Prescale the 3rd aggregate used for size
    if (metadata.min.length === 3) {
      metadata.min[2] = Math.sqrt(metadata.min[2]);
      metadata.max[2] = Math.sqrt(metadata.max[2]);
    }

    // Store the values
    this._xticks = xticks;
    this._yticks = yticks;
  }*/

  /**
   * The tick locations in data space for the x axis.
   */
  private _xticks: number[];

  /**
   * The tick locations in data space for the y axis.
   */
  private _yticks: number[];
}

/**
 * The namespace for the `BarRenderer` class statics.
 */
export
namespace ScatterRenderer {
  /**
   * An options object for initializing a bar renderer.
   */
  export
  interface IOptions {
    /**
     * The point color for the cells if a point array isn't given
     *
     * The default is `''`.
     */
    pointColor?: CellRenderer.ConfigOption<string>;

    /**
     * The radius for the cells if a radius array isn't given
     *
     * The default is `5`.
     */
    radius?: CellRenderer.ConfigOption<number>;

    /**
     * The maximum radius for the cells when a radius array is given
     *
     * The default is `16`.
     */
    maxRadius?: CellRenderer.ConfigOption<number>;

    /**
     * The x axis transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transformX?: TransformFunc;

    /**
     * The y axis transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transformY?: TransformFunc;

    /**
     * The size transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transformSize?: TransformFunc;

    /**
     * The CSS color for drawing the reference lines.
     *
     * The default is `'#E2E2E2'`.
     */
    refColor?: CellRenderer.ConfigOption<string>;
  }
}


/**
 * A cell renderer which renders 2/3/4 dimension arrays as lines
 */
export
class LineRenderer extends CellRenderer {
  /**
   * Construct a new scatter renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: LineRenderer.IOptions = {}) {
    super();
    this.lineColor = options.lineColor || '#407AAA';
    this.transformX = options.transformX || transformLinear({direction: 'x', strict: true});
    this.transformY = options.transformY || transformLinear({direction: 'y'});
    this.refColor = options.refColor || '#E2E2E2';
  }

  /**
   * The CSS color for drawing the lines.
   */
  readonly lineColor: CellRenderer.ConfigOption<string>;

  /**
   * The x axis transform function for the scatter points.
   */
  readonly transformX: TransformFunc;

  /**
   * The y axis transform function for the scatter points.
   */
  readonly transformY: TransformFunc;

  /**
   * The CSS color for drawing the reference lines.
   */
  readonly refColor: CellRenderer.ConfigOption<string>;


  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {

    // Cache the computed positions of the axis lines
    let transformX = this.transformX;
    let transformY = this.transformY;

    let [xmin, ymin] = config.metadata.min;
    let [xmax, ymax] = config.metadata.max;

    let xticks = this._xticks;
    let yticks = this._yticks;

    let xpos = xticks.map( (tick) => {
      return transformX({
      ...config, value: tick, metadata: {...config.metadata, min: xmin, max: xmax}
      });
    });

    let ypos = yticks.map( (tick) => {
      return transformY({
      ...config, value: tick, metadata: {...config.metadata, min: ymin, max: ymax}
      });
    });

    // Draw the reference lines
    let refColor = CellRenderer.resolveOption(this.refColor, config);
    gc.setLineDash([2,2]);
    gc.strokeStyle = refColor;
    gc.beginPath();
      for (let x_i = 0; x_i < xpos.length; x_i++) {
        let x = config.x + xpos[x_i]
        gc.moveTo(x, config.y);
        gc.lineTo(x, config.y + config.height);
      }
      for (let y_i = 0; y_i < ypos.length; y_i++) {
        let y = config.y + config.height - ypos[y_i];
        gc.moveTo(config.x, y);
        gc.lineTo(config.x + config.width, y);
      }
    gc.stroke();

    // Resolve the background color for the cell.
    let color = CellRenderer.resolveOption(this.lineColor, config);

    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    gc.setLineDash([]);
    gc.lineWidth = 3;
    gc.lineJoin = 'round';
    gc.strokeStyle = color;

    let points = config.value;

    // Clipping is slow, need a faster method
    //gc.save();
    //gc.rect(config.x, config.y, config.width, config.height);
    //gc.clip();

    // Set up the path
    gc.beginPath();

    for (let i = 0; i < points.length; i++) {
      let [xval, yval] = points[i];

      // Bail if the x or y value is null
      if (xval == null || yval == null) {
        continue;
      }

      // Transform the data value to x and y values.
      let x = transformX({
        ...config, value: xval, metadata: {...config.metadata, min: xmin, max: xmax}});
      let y = transformY({
        ...config, value: yval, metadata: {...config.metadata, min: ymin, max: ymax}});
  
      if (i == 0) {
        gc.moveTo(config.x + x, config.y + config.height - y);
      } else {
        // Add the point to the path
        gc.lineTo(config.x + x, config.y + config.height - y);
      }
    }
    //gc.closePath()

    // Now render the point
    gc.stroke();
    //gc.restore();
  }

  /**
   * Prepare the graphics context for drawing a column of line cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param config - - The configuration data for the cell.
   *
   **/
  /*prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void {
    let metadata = config.metadata;

    // Calculate nice ticks for this range
    let xticks = Private.generateTicks(metadata.min[0], metadata.max[0], 2, true);
    metadata.min[0] = xticks[0];
    metadata.max[0] = xticks[xticks.length - 1];

    let yticks = Private.generateTicks(metadata.min[1], metadata.max[1], 2);
    metadata.min[1] = yticks[0];
    metadata.max[1] = yticks[yticks.length - 1];

    // Store the values
    this._xticks = xticks;
    this._yticks = yticks;
  }*/

  /**
   * The tick locations in data space for the x axis.
   */
  private _xticks: number[];

  /**
   * The tick locations in data space for the y axis.
   */
  private _yticks: number[];
}

/**
 * The namespace for the `LineRenderer` class statics.
 */
export
namespace LineRenderer {
  /**
   * An options object for initializing a line renderer.
   */
  export
  interface IOptions {
    /**
     * The line color for the cells
     *
     * The default is `''`.
     */
    lineColor?: CellRenderer.ConfigOption<string>;

    /**
     * The x axis transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transformX?: TransformFunc;

    /**
     * The y axis transform function for the renderer.
     *
     * The default is `transformLinear()`.
     */
    transformY?: TransformFunc;

    /**
     * The CSS color for drawing the reference lines.
     *
     * The default is `'#E2E2E2'`.
     */
    refColor?: CellRenderer.ConfigOption<string>;
  }
}



/**
 * A type alias for a transform function.
 */
export
type TransformFunc = CellRenderer.ConfigFunc<any>;


/**
 * Create a linear transform function.
 *
 * @param options - The options for creating the transform function.
 *
 * @returns A new linear transform function.
 */
export
function transformLinear(options: transformLinear.IOptions = {}): TransformFunc {
  let direction = options.direction || 'x';
  let strict = options.strict || true;
  return ({ value, width, height, metadata }) => {
    if (value === null || value === undefined) {
      return null;
    }

    let size: number;
    if (direction === 'x') {
      size = width;
    } else {
      size = height;
    }

    let val = ((value - metadata.min) / (metadata.max - metadata.min)) * size;
    if (!strict) {
      val = (val * 0.8) + (size * 0.10);
    }
    return val;
  };
}

/**
 * A type alias for the axis direction.
 */
export
type AxisDirection = 'x' | 'y';

/**
 * The namespace for the `transformLinear` function statics.
 */
export
namespace transformLinear {
  /**
   * The options for creating a linear transform function.
   */
  export
  interface IOptions {
    /**
     * The axis direction of the transform.
     *
     * The default is `'x'`.
     */
    direction?: AxisDirection;

    /**
     * Whether to buffer the values in the transform
     *
     * The default is `false`.
     */
    strict?: boolean;
  }
}


/**
 * The namespace for the module implementation details.
 */
export
namespace Private {

  let bases = [1, 2, 5];

  /**
   * This eliminates floating point errors otherwise accumulated
   * by repeatedly adding the computed interval.
   */
  function precision(interval: number){
    var multiplier = Math.pow(10, Math.ceil(Math.log10(interval)) + 1);
    return function (value: number){
      return Math.round(value * multiplier) / multiplier;
    };
  }

  /**
   * Calculate a nice interval for the tick marks.
   */
  function getNiceInterval(min: number, max: number, n: number) {

    var rawInterval = (max - min) / n;
    var rawExponent = Math.log10(rawInterval);

    // One of these two integer exponents, in conjunction with one of the bases,
    // will yield the nicest interval.
    var exponents = [Math.floor(rawExponent), Math.ceil(rawExponent)];

    var nicestInterval = Infinity;

    bases.forEach( (base) => {
      exponents.forEach( (exponent) => {

        // Try each combination of base and interval.
        var currentInterval = base * Math.pow(10, exponent);

        // Pick the combination that yields the nice interval that
        // most closely matches the raw interval.
        var currentDeviation = Math.abs(rawInterval - currentInterval);
        var nicestDeviation  = Math.abs(rawInterval - nicestInterval);

        if ( currentDeviation < nicestDeviation ){
          nicestInterval = currentInterval;
        }
      });
    });

    return nicestInterval;
  }

  function getFirstTickValue(min: number, interval: number){
    return Math.floor(min / interval) * interval;
  }

  export
  function generateTicks(min: number, max: number, n: number, tight: boolean = true) {

    let interval = getNiceInterval(min, max, n);
    let value = getFirstTickValue(min, interval);

    let ticks = [value];

    while(value < max) {
      value += interval;
      ticks.push(value);
    }

    ticks = ticks.map(precision(interval));

    if (tight) {
      ticks[0] = min;
      ticks[ticks.length - 1] = max;
    }

    return ticks;
  }
}
