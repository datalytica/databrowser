
import {
  CellRenderer, TextRenderer
} from '@phosphor/datagrid';

import {
  GraphicsContext
} from '@phosphor/datagrid';

import {
  ColumnStats
} from './tabledatamodel';


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
  /*paint(gc: GraphicsContext, config: CellRenderer.ICellConfig): void {
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
      iconX = config.x + config.width - (icon.width + 6);
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
 * A cell renderer which renders a specialized table header.
 */
export
class HeaderRenderer extends TextRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: HeaderRenderer.IOptions = {}) {
    super(options);
    this.icon = options.icon || null;
    this.headerFont = options.headerFont || this.font;
    this.minBinWidth = options.minBinWidth || 5;
  }

  /**
   * Icon to render.
   */
  readonly icon: CellRenderer.ConfigOption<HTMLImageElement | null>;

  /**
   * The CSS shorthand font for drawing the text.
   */
  readonly headerFont: CellRenderer.ConfigOption<string>;


  readonly minBinWidth: number;


  /**
   * Draw the text and icon for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Resolve the font for the cell.
    let font = CellRenderer.resolveOption(this.headerFont, config);

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
    let hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - 2;

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

    iconY = config.y + 2 + textHeight / 2 - iconHeight / 2;
    textY = config.y + 2 + textHeight;

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
    let { header, totalCount, nullBin, maxBinCount, hoveredBin, bins, isLinked, desc, extra} = config.value as ColumnStats;
    let text = header; //this.format({ value: header, ...config});

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
    const elide = '\u2026';
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

    if (config.height > textHeight * 2 + 8) {
      // Need to elide for categories
      text = desc;
      gc.font = CellRenderer.resolveOption(this.font, config);
      gc.textAlign = 'center';

      textWidth = gc.measureText(text).width;
      boxWidth = config.width - 4 - gc.measureText(extra).width;

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

      gc.fillText(text + extra, config.x + config.width / 2, config.y + config.height - 2);
    }


    let barColor = '#a1bbff';
    gc.fillStyle = barColor;

    if (config.height > textHeight + 4) {
      let nullFrac = (totalCount - nullBin.count) / totalCount;
      gc.fillRect(config.x, textY + 2, Math.ceil(nullFrac * (config.width - 1)), 5);

      if (isLinked === true) {
        gc.fillStyle = 'rgba(75, 75, 75, .35)';

        let nullFrac = nullBin.linked!.size() / totalCount;
        gc.fillRect(config.x, textY + 2, Math.ceil(nullFrac * (config.width - 1)), 5);


        gc.fillStyle = barColor;
      }
    }

    if (config.height > textHeight * 2 + 16) {
      let orig = config.y + textHeight + 4;

      let x = config.x + 2;
      let width = config.width - 4;
      let y = config.y + config.height - orig;
      let height = y - (textY + 10);

      let maxBinW = 20;
      let binCount = bins.length;

      if (binCount > 0) {
        let binWidth = Math.max(this.minBinWidth, Math.floor(width / binCount));

        binCount = Math.min(binCount, Math.floor(width / binWidth));

        if (binWidth > maxBinW) {
          binWidth = maxBinW;
          x += (width - binWidth * binCount) / 2;
        }

        let start = x;

        for (let i = 0; i < binCount; i++) {
          let bin = bins[i];
          let h = Math.ceil((bin.count * height) / maxBinCount);
          gc.fillRect(start, y - h, binWidth - 1, h);
          start += binWidth;
        }

        if (isLinked === true) {
          let start = x;
          gc.fillStyle = 'rgba(75, 75, 75, .35)';
          for (let i = 0; i < binCount; i++) {
            let bin = bins[i];
            let h = Math.ceil((bin.linked!.size() * height) / maxBinCount);
            gc.fillRect(start, y - h, binWidth - 1, h);
            start += binWidth;
          }
        }
        if (hoveredBin != -1) {
          gc.fillStyle = "rgba(0, 0, 0, .25)"
          gc.fillRect(x + binWidth * hoveredBin, y - height, binWidth - 1, height);
        }
      }      
    }

  }

  hitTestBin(x: number, y: number, width: number, height: number, value: object): number | 'null' {
    let font = CellRenderer.resolveOption(this.headerFont,
      {x: 0, y: 0, width: width, height: height,
        region: 'column-header', row: 0, column: 0, metadata: {}, value: null});

    let textHeight = TextRenderer.measureFontHeight(font);
    let textY = 2 + textHeight;

    let { bins } = value as ColumnStats;

    if (y > textY + 2 && y < textY + 2 + 5) {
      return 'null';
    }

    if (y > textHeight + 16 && y < height - (textHeight + 4)) {
      let orig = textHeight + 4;

      width = width - 4;
      height = height - orig - (textY + 10);

      let maxBinW = 20;
      let binCount = bins.length;

      if (binCount > 0) {
        let binWidth = Math.max(this.minBinWidth, Math.floor(width / binCount));

        binCount = Math.min(binCount, Math.floor(width / binWidth));

        let start = 2;

        if (binWidth > maxBinW) {
          binWidth = maxBinW;
          start += (width - binWidth * binCount) / 2;
        }

        for (let i = 0; i < binCount; i++) {
          if (start <= x && x < start + binWidth) {
            return i;
          }
          start += binWidth;
        }
      }
    }
    return -1;
  }
}


/**
 * The namespace for the `HeaderRenderer` class statics.
 */
export
namespace HeaderRenderer {
  /**
   * An options object for initializing an header renderer.
   */
  export
  interface IOptions extends TextRenderer.IOptions {
    /**
     * The icon to render.
     *
     * The default is `'null'`.
     */
    icon?: CellRenderer.ConfigOption<HTMLImageElement | null>;

    /**
     * The font for drawing the cell header.
     *
     * The default is `'12px sans-serif'`.
     */
    headerFont?: CellRenderer.ConfigOption<string>;

    /**
     * The minimum bin width.
     *
     * The default is `'4px'`.
     */
    minBinWidth?: number;

  }
}
