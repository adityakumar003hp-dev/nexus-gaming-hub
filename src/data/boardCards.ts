export interface CardCategory {
  title: string;
  description?: string;
  actions: Record<number, string>;
}

export interface BoardCardsData {
  chanceEven: CardCategory;
  chanceOdd: CardCategory;
  imfEven: CardCategory;
  imfOdd: CardCategory;
}

export const BOARD_CARDS_DATA: BoardCardsData = {
  chanceEven: {
    title: "Chance - Even nos: (2, 4, 6, 8, 10 and 12)",
    actions: {
      2: "Loss in export, pay $2000 to bank",
      4: "Celebrate your birthday, collect $500 from each player",
      6: "Filed inappropriate income tax return, pay $3000 to bank as fine",
      8: "Won a lottery, receive $2500 from bank",
      10: "Go to jail, pay $500 to bank",
      12: "Achieved the export target, receive $3000 from bank for best performance"
    }
  },
  chanceOdd: {
    title: "Chance - Odd nos: (3, 5, 7, 9 and 11)",
    actions: {
      3: "For office renovation, pay $2500 to bank",
      5: "Income tax refunds, collect $2000 from bank",
      7: "Go to guest house, you cannot play the next turn",
      9: "Loss due to fire in warehouse, pay $3000 to bank",
      11: "Go to start, collect $1500 from bank"
    }
  },
  imfEven: {
    title: "International Monetary Fund - Even nos: (2, 4, 6, 8, 10 and 12)",
    actions: {
      2: "School and medical fees, pay $1000 to bank",
      4: "Received dividend on shares, collect $2500 from bank",
      6: "Marriage celebration, pay $2000 to bank",
      8: "For car repairing, pay $500 to bank",
      10: "Insurance premiums, pay $1500 to bank",
      12: "Sale of stocks, collect $3000 from bank"
    }
  },
  imfOdd: {
    title: "International Monetary Fund - Odd nos: (3, 5, 7, 9 and 11)",
    actions: {
      3: "You have won jackpot, collect $2000 from bank as prize money",
      5: "Fine for accident due to reckless driving, deposit $1000 in bank",
      7: "You have inherited $3000 from a distant relative, collect it from bank",
      9: "Make repairs in all your properties, pay $100 for each house and $200 for each hotel you own",
      11: "Go to jail, pay $500 to bank"
    }
  }
};
