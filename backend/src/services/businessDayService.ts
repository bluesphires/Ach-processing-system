import moment from 'moment';
import 'moment-business-days';
import { BusinessDayCalculatorOptions, FederalHoliday } from '@/types';

export class BusinessDayService {
  private holidays: Date[] = [];

  constructor(holidays: FederalHoliday[] = []) {
    this.updateHolidays(holidays);
  }

  /**
   * Update the list of federal holidays
   */
  updateHolidays(holidays: FederalHoliday[]): void {
    this.holidays = holidays.map(holiday => new Date(holiday.date));
    
    // Configure moment-business-days with holidays
    const holidayDates = this.holidays.map(date => 
      moment(date).format('YYYY-MM-DD')
    );
    
    moment.updateLocale('us', {
      holidays: holidayDates,
      holidayFormat: 'YYYY-MM-DD'
    });
  }

  /**
   * Check if a date is a business day (not weekend and not a holiday)
   */
  isBusinessDay(date: Date): boolean {
    const momentDate = moment(date);
    
    // Check if it's a weekend
    if (momentDate.day() === 0 || momentDate.day() === 6) {
      return false;
    }
    
    // Check if it's a holiday
    return !this.isHoliday(date);
  }

  /**
   * Check if a date is a federal holiday
   */
  isHoliday(date: Date): boolean {
    const dateString = moment(date).format('YYYY-MM-DD');
    return this.holidays.some(holiday => 
      moment(holiday).format('YYYY-MM-DD') === dateString
    );
  }

  /**
   * Add business days to a date
   */
  addBusinessDays(date: Date, days: number): Date {
    const momentDate = moment(date);
    return momentDate.businessAdd(days).toDate();
  }

  /**
   * Subtract business days from a date
   */
  subtractBusinessDays(date: Date, days: number): Date {
    const momentDate = moment(date);
    return momentDate.businessSubtract(days).toDate();
  }

  /**
   * Get the next business day from a given date
   */
  getNextBusinessDay(date: Date): Date {
    return this.addBusinessDays(date, 1);
  }

  /**
   * Get the previous business day from a given date
   */
  getPreviousBusinessDay(date: Date): Date {
    return this.subtractBusinessDays(date, 1);
  }

  /**
   * Calculate business days between two dates
   */
  getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    const start = moment(startDate);
    const end = moment(endDate);
    return start.businessDiff(end);
  }

  /**
   * Get the ACH effective date (next business day if current date is not a business day)
   */
  getACHEffectiveDate(date: Date = new Date()): Date {
    if (this.isBusinessDay(date)) {
      return date;
    }
    return this.getNextBusinessDay(date);
  }

  /**
   * Get the credit effective date (2 business days after debit effective date)
   */
  getCreditEffectiveDate(debitEffectiveDate: Date): Date {
    return this.addBusinessDays(debitEffectiveDate, 2);
  }

  /**
   * Get default federal holidays for a given year
   */
  static getDefaultFederalHolidays(year: number): FederalHoliday[] {
    const holidays: FederalHoliday[] = [
      {
        id: `new-years-${year}`,
        name: "New Year's Day",
        date: new Date(year, 0, 1),
        year,
        recurring: true
      },
      {
        id: `mlk-day-${year}`,
        name: "Martin Luther King Jr. Day",
        date: this.getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday in January
        year,
        recurring: true
      },
      {
        id: `presidents-day-${year}`,
        name: "Presidents Day",
        date: this.getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday in February
        year,
        recurring: true
      },
      {
        id: `memorial-day-${year}`,
        name: "Memorial Day",
        date: this.getLastWeekdayOfMonth(year, 4, 1), // Last Monday in May
        year,
        recurring: true
      },
      {
        id: `independence-day-${year}`,
        name: "Independence Day",
        date: new Date(year, 6, 4),
        year,
        recurring: true
      },
      {
        id: `labor-day-${year}`,
        name: "Labor Day",
        date: this.getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday in September
        year,
        recurring: true
      },
      {
        id: `columbus-day-${year}`,
        name: "Columbus Day",
        date: this.getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday in October
        year,
        recurring: true
      },
      {
        id: `veterans-day-${year}`,
        name: "Veterans Day",
        date: new Date(year, 10, 11),
        year,
        recurring: true
      },
      {
        id: `thanksgiving-${year}`,
        name: "Thanksgiving Day",
        date: this.getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday in November
        year,
        recurring: true
      },
      {
        id: `christmas-${year}`,
        name: "Christmas Day",
        date: new Date(year, 11, 25),
        year,
        recurring: true
      }
    ];

    // Adjust holidays that fall on weekends
    return holidays.map(holiday => {
      const date = new Date(holiday.date);
      const dayOfWeek = date.getDay();
      
      // If holiday falls on Saturday, observe on Friday
      if (dayOfWeek === 6) {
        date.setDate(date.getDate() - 1);
      }
      // If holiday falls on Sunday, observe on Monday
      else if (dayOfWeek === 0) {
        date.setDate(date.getDate() + 1);
      }
      
      return {
        ...holiday,
        date
      };
    });
  }

  /**
   * Get the nth occurrence of a weekday in a month
   */
  private static getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): Date {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysToAdd = (weekday - firstWeekday + 7) % 7;
    const date = new Date(year, month, 1 + daysToAdd + (occurrence - 1) * 7);
    return date;
  }

  /**
   * Get the last occurrence of a weekday in a month
   */
  private static getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const daysToSubtract = (lastWeekday - weekday + 7) % 7;
    const date = new Date(year, month + 1, 0 - daysToSubtract);
    return date;
  }
}