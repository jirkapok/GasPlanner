var app=require("../Add.ts");
describe("Addition",function(){
it("The function should add 2 numbers",function() {
var value=app.AddNumber(5,6);
expect(value).toBe(11);
});
});
