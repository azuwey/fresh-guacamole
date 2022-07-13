class Assignable {
  constructor(properties: {[key: string]: any}) {
    Object.keys(properties).map((key) => {
      // @ts-ignore
      return (this[key] = properties[key]);
    });
  }
}

export class Payload extends Assignable {}