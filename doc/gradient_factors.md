# Conservatism - Gradient Factors (Dive options)

This is the key options which defines the generated profile curve. For more details about this option see [Gradient factors article](https://www.diverite.com/articles/gradient-factors/) by Dive rite.
You can use predefined group of values, which correspond with values used by Shearwater dive computers. Both values are in range 10-100 %. Where 100 % means pure Bühlmann with no gradient factors. Today it is generally considered as not safe enough. The lower the value is, the more safety you get by reducing allowed maximum tissue pressure (supersaturation level). But the price is longer ascent. So the correct behavior is to find sme compromise. Here is simple explanation how it works.

* `Gradient factor Low` (GF Low): Is applied on depths range. It defines moment at which we first time reach the maximum supersaturation level. I.e. it defines depth of first stop. Low value means the first stop will be at higher depth. More about deep stops in [this article](https://thetheoreticaldiver.org/wordpress/index.php/2019/06/16/short-comment-on-doolettes-gradient-factors-in-a-post-deep-stops-world/)

* `Gradient factor High` (GF High): Is applied on tissue supersaturation level. The higher value you define, the higher allowed pressure in body tissues you allow when surfacing. The moment at which you surface is defined by duration of last stop, which this value controls. The higher value you define, the shorter will be the last stop duration.

Following chart shows how different gradient factors apply to ascent profile. Legend shows gradients as GFLow/GFHigh. As you can see gf Low 20 % starts stops deeper, than GF Low 40 %. Similar GF High 70 % means longer stop at 3 meters (10 ft) than GF High 90 %, in which case you reach the surfaces faster. 100/100 means pure Bühlmann, with no additional safety margin.

![Gradient factors comparison chart](./gf_profile_comparison.png)

Which values to apply? Here are recommended values explained:

| Gradient factors | Recommendation |
| --- | --- |
| Low (45/95) | Shallow dive, good conditions, fit and healthy diver |
| Medium (40/85) | Repetitive dive, average conditions |
| High (30/75) | Deep dives, decompression dives, hard conditions |
