import React from 'react';
import './LegalPages.css';

const SizeChartPage = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">Size Guide</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="legal-content">
          <p>
            Find your perfect fit with our comprehensive size guide. Measurements are in inches unless otherwise specified. 
            For the best fit, we recommend measuring a similar item of clothing you already own that fits well.
          </p>

          <section className="legal-section fade-in-section is-visible">
            <h2>T-Shirts</h2>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>38</td><td>27.5</td><td>16.5</td></tr>
                  <tr><td>M</td><td>40</td><td>28.5</td><td>17.5</td></tr>
                  <tr><td>L</td><td>42</td><td>29.5</td><td>18.5</td></tr>
                  <tr><td>XL</td><td>44</td><td>30.5</td><td>19.5</td></tr>
                  <tr><td>XXL</td><td>46</td><td>31.5</td><td>20.5</td></tr>
                </tbody>
              </table>
            </div>
            <p className="size-tip"><strong>Fit Tip:</strong> Our standard t-shirts have a relaxed retail fit. Size up if you prefer an oversized drop-shoulder look.</p>
          </section>

          <section className="legal-section fade-in-section is-visible" style={{ '--stagger-index': 1 }}>
            <h2>Hoodies & Sweatshirts</h2>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Sleeve (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>40</td><td>26</td><td>24</td></tr>
                  <tr><td>M</td><td>44</td><td>27</td><td>24.5</td></tr>
                  <tr><td>L</td><td>48</td><td>28</td><td>25</td></tr>
                  <tr><td>XL</td><td>52</td><td>29</td><td>25.5</td></tr>
                  <tr><td>XXL</td><td>56</td><td>30</td><td>26</td></tr>
                </tbody>
              </table>
            </div>
            <p className="size-tip"><strong>Fit Tip:</strong> Our winter wear is designed with slightly dropped shoulders for comfort layering.</p>
          </section>

          <section className="legal-section fade-in-section is-visible" style={{ '--stagger-index': 2 }}>
            <h2>Jackets (Varsity & Bomber)</h2>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (in)</th>
                    <th>Length (in)</th>
                    <th>Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>42</td><td>26</td><td>18</td></tr>
                  <tr><td>M</td><td>44</td><td>27</td><td>19</td></tr>
                  <tr><td>L</td><td>46</td><td>28</td><td>20</td></tr>
                  <tr><td>XL</td><td>48</td><td>29</td><td>21</td></tr>
                  <tr><td>XXL</td><td>50</td><td>30</td><td>22</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-section fade-in-section is-visible" style={{ '--stagger-index': 3 }}>
            <h2>Footwear / Shoes</h2>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>UK / India</th>
                    <th>US (Men)</th>
                    <th>US (Women)</th>
                    <th>EU Size</th>
                    <th>Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>UK 6</td><td>US 7</td><td>US 8.5</td><td>EU 40</td><td>25.4</td></tr>
                  <tr><td>UK 7</td><td>US 8</td><td>US 9.5</td><td>EU 41</td><td>26.2</td></tr>
                  <tr><td>UK 8</td><td>US 9</td><td>US 10.5</td><td>EU 42</td><td>27.1</td></tr>
                  <tr><td>UK 9</td><td>US 10</td><td>US 11.5</td><td>EU 43</td><td>27.9</td></tr>
                  <tr><td>UK 10</td><td>US 11</td><td>US 12.5</td><td>EU 44</td><td>28.8</td></tr>
                  <tr><td>UK 11</td><td>US 12</td><td>US 13.5</td><td>EU 45</td><td>29.6</td></tr>
                </tbody>
              </table>
            </div>
            <p className="size-tip"><strong>Fit Tip:</strong> If you are between sizes, we recommend sizing up for closed footwear like sneakers and boots.</p>
          </section>

          <section className="legal-section fade-in-section is-visible" style={{ '--stagger-index': 4 }}>
            <h2>Caps & Accessories</h2>
            <div className="table-responsive">
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Item Type</th>
                    <th>Size Details</th>
                    <th>Adjustable Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Snapback Caps</strong></td>
                    <td>Free Size / One Size Fits All</td>
                    <td>22" - 24" circumference</td>
                  </tr>
                  <tr>
                    <td><strong>Dad Hats</strong></td>
                    <td>Free Size / One Size Fits All</td>
                    <td>21.5" - 23.5" (buckle closure)</td>
                  </tr>
                  <tr>
                    <td><strong>Tote Bags</strong></td>
                    <td>Standard</td>
                    <td>15" x 16" (handle drop 11")</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="size-tip"><strong>Caps:</strong> All our headwear features adjustable closures at the back to fit almost any head size comfortably.</p>
          </section>

          <section className="legal-section fade-in-section is-visible" style={{ '--stagger-index': 5 }}>
            <h2>How to Measure</h2>
            <ul className="legal-list">
              <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
              <li><strong>Length:</strong> Measure from the highest point of the shoulder down to the hem.</li>
              <li><strong>Shoulder:</strong> Measure across the back from shoulder seam to shoulder seam.</li>
              <li><strong>Sleeve:</strong> Measure from the center back of the neck, across the shoulder, down to the wrist.</li>
              <li><strong>Foot:</strong> Stand on a piece of paper, mark the tip of your longest toe and your heel, then measure the distance.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SizeChartPage;
