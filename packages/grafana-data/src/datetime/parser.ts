/* eslint-disable id-blacklist, no-restricted-imports, @typescript-eslint/ban-types */
import moment, { MomentInput } from 'moment-timezone';
import { DateTimeInput, DateTime, isDateTime } from './moment_wrapper';
import { DateTimeOptions, getTimeZone } from './common';
import { parse, isValid } from './datemath';
import { lowerCase } from 'lodash';

/**
 * Type that describes options that can be passed when parsing a date and time value.
 * @public
 */
export interface DateTimeOptionsWhenParsing extends DateTimeOptions {
  /**
   * If the input is a Grafana quick date e.g. now-6h you can specify this to control
   * if the last part of the date and time value should be included or excluded.
   *
   * As an example now-6h and the current time is 12:20:00 if roundUp is set to true
   * the returned DateTime value will be 06:00:00.
   */
  roundUp?: boolean;
}

type DateTimeParser<T extends DateTimeOptions = DateTimeOptions> = (value: DateTimeInput, options?: T) => DateTime;

/**
 * Helper function to parse a number, text or Date to a DateTime value. If a timeZone is supplied the incoming value
 * will be parsed with that timeZone as a base. The only exception to this is if the passed value is in a UTC based
 * format. Then it will use UTC as the base. Examples on UTC based values are Unix Epoch, ISO formatted strings etc.
 *
 * It can also parse the Grafana quick date and time format e.g. now-6h will be parsed as Date.now() - 6 hours and
 * returned as a valid DateTime value.
 *
 * If no options is supplied default values will be used. For more details please see {@link DateTimeOptions}.
 *
 * @param value - should be a date and time parsable value
 * @param options
 *
 * @public
 */
export const dateTimeParse: DateTimeParser<DateTimeOptionsWhenParsing> = (value, options?): DateTime => {
  if (isDateTime(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return parseString(value, options);
  }

  return parseOthers(value, options);
};

const parseString = (value: string, options?: DateTimeOptionsWhenParsing): DateTime => {
  if (value.indexOf('now') !== -1) {
    if (!isValid(value)) {
      return moment() as DateTime;
    }

    const parsed = parse(value, options?.roundUp, options?.timeZone);
    return parsed || (moment() as DateTime);
  }

  return parseOthers(value, options);
};

const parseOthers = (value: DateTimeInput, options?: DateTimeOptionsWhenParsing): DateTime => {
  const date = value as MomentInput;
  const timeZone = getTimeZone(options);
  const zone = moment.tz.zone(timeZone);

  if (zone && zone.name) {
    return moment.tz(date, zone.name) as DateTime;
  }

  switch (lowerCase(timeZone)) {
    case 'utc':
      return moment.utc(date) as DateTime;
    default:
      return moment(date) as DateTime;
  }
};
