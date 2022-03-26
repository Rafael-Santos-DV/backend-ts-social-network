const whitelist = [process.env.URL_ROUTE1, process.env.URL_ROUTE2, process.env.URL_ROUTE3];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean | undefined) => void) {

    if (origin) {
      console.log(origin);
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(origin);
        callback(new Error('Not allowed by CORS'));
      }
    }

  }
};

export default corsOptions;
